'use strict';

const path = require('path');
const crypto = require('crypto');
const { Op, literal } = require('sequelize');
const {
  Event, Location, Category, User, EventImage, EventInteraction,
  EventRegistration, EventReview, EventTicket, Payment, sequelize,
} = require('../models');
const notificationService = require('../services/notificationService');
const { resolveCanonicalCity } = require('../utils/cityResolver');

let lastReconcileTime = 0;
// Reconciles event lifecycle statuses automatically (throttled to max once per minute to keep queries lightning fast)
const reconcileEventStatuses = async (force = false) => {
  const nowMs = Date.now();
  if (!force && nowMs - lastReconcileTime < 60000) {
    return;
  }
  lastReconcileTime = nowMs;
  try {
    const now = new Date();
    // 1. End events that passed end_datetime -> Completed
    await Event.update(
      { status: 'Completed' },
      {
        where: {
          status: { [Op.in]: ['Published', 'Ongoing'] },
          end_datetime: { [Op.ne]: null, [Op.lte]: now }
        }
      }
    );
    // 2. Mark ongoing events
    await Event.update(
      { status: 'Ongoing' },
      {
        where: {
          status: 'Published',
          start_datetime: { [Op.lte]: now },
          end_datetime: { [Op.gt]: now }
        }
      }
    );
  } catch (err) {
    console.warn('reconcileEventStatuses warning:', err.message);
  }
};

const formatEventCard = (ev) => {
  const img = ev.images && ev.images[0];
  const imageUrl = img && img.original_image_path
    ? (img.original_image_path.startsWith('/') ? img.original_image_path : `/uploads/${path.basename(img.original_image_path)}`)
    : null;

  const numPrice = parseFloat(ev.price || 0);
  const isFree = isNaN(numPrice) || numPrice <= 0;

  return {
    event_id: ev.event_id,
    title: ev.title,
    start_datetime: ev.start_datetime,
    end_datetime: ev.end_datetime,
    registration_deadline: ev.registration_deadline,
    price: isFree ? 0 : numPrice,
    is_free: isFree,
    isFree: isFree,
    price_label: isFree ? 'FREE' : `₹${numPrice % 1 === 0 ? numPrice.toFixed(0) : numPrice.toFixed(2)}`,
    currency: ev.currency,
    capacity: ev.capacity,
    status: ev.status,
    description: ev.description,
    category: ev.category ? { id: ev.category.category_id, name: ev.category.name, slug: ev.category.slug, icon: ev.category.icon } : null,
    location: ev.location ? {
      venue_name: ev.location.venue_name,
      formatted_address: ev.location.formatted_address,
      city: ev.location.city,
      district: ev.location.district,
      state: ev.location.state,
      locality: ev.location.locality,
      postal_code: ev.location.postal_code,
      discovery_city: ev.location.discovery_city || ev.location.city,
      latitude: ev.location.latitude,
      longitude: ev.location.longitude,
    } : null,
    organizer: ev.organizer ? { user_id: ev.organizer.user_id, name: ev.organizer.name, email: ev.organizer.email } : null,
    image_url: imageUrl,
    original_image_url: imageUrl,
    going_count: ev.interactions ? ev.interactions.filter(i => i.interaction_type === 'Going').length : 0,
    interested_count: ev.interactions ? ev.interactions.filter(i => i.interaction_type === 'Interested').length : 0,
  };
};

const baseEventInclude = [
  { model: Category, as: 'category', attributes: ['category_id', 'name', 'slug', 'icon'] },
  { model: Location, as: 'location' },
  { model: User, as: 'organizer', attributes: ['user_id', 'name', 'email'] },
  { model: EventImage, as: 'images', order: [['created_at', 'ASC']], limit: 1 },
  { model: EventInteraction, as: 'interactions', attributes: ['interaction_type', 'user_id'] },
];

// GET /api/events
const getEvents = async (req, res) => {
  try {
    await reconcileEventStatuses();

    const {
      search, city, category, date, page = 1, limit = 12, status
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      moderation_status: 'Approved'
    };
    if (status && status !== 'all') {
      where.status = status;
    } else if (!status) {
      // By default show active events
      where.status = { [Op.in]: ['Published', 'Ongoing'] };
    }

    const locationWhere = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    // City & district filtering using actual event location with canonical phonetic aliasing
    if (city && city.toLowerCase() !== 'all') {
      const trimmedCity = city.trim();
      const canonical = resolveCanonicalCity(trimmedCity);
      if (canonical.toLowerCase() !== trimmedCity.toLowerCase()) {
        locationWhere[Op.or] = [
          { city: trimmedCity },
          { city: canonical },
          { discovery_city: canonical },
          { city: { [Op.like]: `%${trimmedCity}%` } },
        ];
      } else {
        locationWhere[Op.or] = [
          { city: trimmedCity },
          { discovery_city: trimmedCity },
        ];
      }
    }

    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.start_datetime = { [Op.between]: [d, next] };
    }

    const categoryWhere = {};
    if (category && category !== 'all') {
      categoryWhere.slug = category;
    }

    const hasCategoryFilter = Reflect.ownKeys(categoryWhere).length > 0;
    const hasLocationFilter = Reflect.ownKeys(locationWhere).length > 0;

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          where: hasCategoryFilter ? categoryWhere : undefined,
          required: hasCategoryFilter,
          attributes: ['category_id', 'name', 'slug', 'icon']
        },
        {
          model: Location,
          as: 'location',
          where: hasLocationFilter ? locationWhere : undefined,
          required: hasLocationFilter
        },
        { model: User, as: 'organizer', attributes: ['user_id', 'name', 'email'] },
        { model: EventImage, as: 'images', limit: 1 },
        { model: EventInteraction, as: 'interactions', attributes: ['interaction_type', 'user_id'] },
      ],
      order: [['start_datetime', 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    return res.json({
      success: true,
      events: rows.map(formatEventCard),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('getEvents error:', err);
    return res.status(500).json({ success: false, message: 'Could not load events.' });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    await reconcileEventStatuses();

    const ev = await Event.findByPk(req.params.id, {
      include: [
        ...baseEventInclude,
        {
          model: EventReview,
          as: 'reviews',
          include: [{ model: User, as: 'reviewer', attributes: ['name', 'profile_image'] }]
        }
      ],
    });

    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (ev.moderation_status === 'Hidden') {
      const isOwner = req.user && req.user.user_id === ev.organizer_id;
      const isAdmin = req.user && req.user.role === 'Admin';
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ success: false, message: 'This event listing is currently hidden by moderation.' });
      }
    }

    // Ensure status is current for this specific event
    const now = new Date();
    if (ev.status !== 'Completed' && ev.end_datetime && new Date(ev.end_datetime) <= now) {
      ev.status = 'Completed';
      await ev.save();
    } else if (ev.status === 'Published' && ev.start_datetime && new Date(ev.start_datetime) <= now && (!ev.end_datetime || new Date(ev.end_datetime) > now)) {
      ev.status = 'Ongoing';
      await ev.save();
    }

    const card = formatEventCard(ev);
    card.reviews = ev.reviews || [];

    // If authenticated, check attendee's interaction & registration state
    if (req.user) {
      const reg = await EventRegistration.findOne({
        where: { event_id: ev.event_id, user_id: req.user.user_id },
      });
      card.user_registration = reg ? { status: reg.registration_status, id: reg.registration_id } : null;
    }

    return res.json({ success: true, event: card });
  } catch (err) {
    console.error('getEventById error:', err);
    return res.status(500).json({ success: false, message: 'Could not load event.' });
  }
};

// POST /api/events
const createEvent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      title, description, category_id,
      start_datetime, end_datetime, registration_deadline,
      capacity, price, currency,
      venue_name, formatted_address, city, district, state, locality,
      postal_code, latitude, longitude, discovery_city,
    } = req.body;

    if (!title || !String(title).trim() || !city || !String(city).trim() || !state || !String(state).trim() ||
        !Number.isFinite(new Date(start_datetime).getTime()) ||
        (end_datetime && (!Number.isFinite(new Date(end_datetime).getTime()) || new Date(end_datetime) <= new Date(start_datetime))) ||
        (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) ||
        (latitude !== undefined && latitude !== '' && (!Number.isFinite(Number(latitude)) || Math.abs(Number(latitude)) > 90)) ||
        (longitude !== undefined && longitude !== '' && (!Number.isFinite(Number(longitude)) || Math.abs(Number(longitude)) > 180)) ||
        (capacity !== undefined && capacity !== '' && (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0))) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'A title, city, state, valid event dates, non-negative price and positive capacity are required.' });
    }

    // Robust Date parsing for any format (DD/MM/YYYY or YYYY-MM-DD)
    let parsedStartDate = new Date(start_datetime);
    if (isNaN(parsedStartDate.getTime())) {
      const parts = String(start_datetime).split(/[\/\-\sT:]/);
      if (parts.length >= 3) {
        parsedStartDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    if (isNaN(parsedStartDate.getTime())) {
      parsedStartDate = new Date();
    }

    // End date calculation (default to start + 3 hours if omitted)
    let parsedEndDate = end_datetime ? new Date(end_datetime) : null;
    if (!parsedEndDate || isNaN(parsedEndDate.getTime())) {
      parsedEndDate = new Date(parsedStartDate.getTime() + 3 * 3600 * 1000);
    }

    // Resolve Category ID
    let resolvedCategoryId = parseInt(category_id);
    if (isNaN(resolvedCategoryId)) {
      const cat = await Category.findOne({ where: { slug: category_id } });
      resolvedCategoryId = cat ? cat.category_id : 1;
    }

    // Check for accidental duplicate submission from same organizer within last 20 seconds
    const duplicate = await Event.findOne({
      where: {
        organizer_id: req.user.user_id,
        title: title.trim(),
        created_at: {
          [Op.gte]: new Date(Date.now() - 20 * 1000)
        }
      },
      transaction: t
    });
    if (duplicate) {
      await t.rollback();
      return res.status(200).json({
        success: true,
        message: `Event "${title.trim()}" already published! 🎉`,
        event_id: duplicate.event_id,
        event: duplicate,
        city: city || 'Surat'
      });
    }

    // Resolve Location data
    let resolvedCity = city ? resolveCanonicalCity(city.trim()) : '';
    let resolvedDistrict = district ? district.trim() : '';
    let resolvedState = state ? state.trim() : '';
    const resolvedVenue = venue_name ? venue_name.trim() : 'Event Venue';

    // If city was not sent or defaulted to Ahmedabad, check if venue_name contains explicit city
    const lowerVenue = resolvedVenue.toLowerCase();
    if (!resolvedCity || resolvedCity === 'Ahmedabad') {
      if (lowerVenue.includes('surat')) {
        resolvedCity = 'Surat';
        resolvedDistrict = resolvedDistrict || 'Surat';
        resolvedState = resolvedState || 'Gujarat';
      } else if (lowerVenue.includes('koba')) {
        resolvedCity = 'Koba';
        resolvedDistrict = 'Gandhinagar';
        resolvedState = 'Gujarat';
      } else if (lowerVenue.includes('adalaj')) {
        resolvedCity = 'Adalaj';
        resolvedDistrict = 'Gandhinagar';
        resolvedState = 'Gujarat';
      } else if (lowerVenue.includes('gandhinagar')) {
        resolvedCity = 'Gandhinagar';
        resolvedDistrict = 'Gandhinagar';
        resolvedState = 'Gujarat';
      } else if (lowerVenue.includes('mumbai')) {
        resolvedCity = 'Mumbai';
        resolvedDistrict = 'Mumbai Suburban';
        resolvedState = 'Maharashtra';
      } else if (lowerVenue.includes('delhi')) {
        resolvedCity = 'Delhi';
        resolvedDistrict = 'New Delhi';
        resolvedState = 'Delhi';
      } else if (lowerVenue.includes('bengaluru') || lowerVenue.includes('bangalore')) {
        resolvedCity = 'Bengaluru';
        resolvedDistrict = 'Bengaluru Urban';
        resolvedState = 'Karnataka';
      } else if (!resolvedCity) {
        resolvedCity = 'Ahmedabad';
      }
    }

    resolvedDistrict = resolvedDistrict || resolvedCity;
    resolvedState = resolvedState || 'Gujarat';
    const resolvedAddress = formatted_address || `${resolvedVenue}, ${resolvedCity}, ${resolvedState}, India`;

    // Create location record in MySQL
    const location = await Location.create({
      venue_name: resolvedVenue,
      formatted_address: resolvedAddress,
      locality: locality || null,
      city: resolvedCity,
      district: resolvedDistrict,
      state: resolvedState,
      postal_code: postal_code || null,
      country_code: 'IN',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      discovery_city: discovery_city ? resolveCanonicalCity(discovery_city.trim()) : resolvedCity,
    }, { transaction: t });

    // Create event record in MySQL
    const event = await Event.create({
      organizer_id: req.user.user_id,
      category_id: resolvedCategoryId,
      location_id: location.location_id,
      title: title.trim(),
      description: description ? description.trim() : '',
      start_datetime: parsedStartDate,
      end_datetime: parsedEndDate,
      registration_deadline: registration_deadline ? new Date(registration_deadline) : null,
      capacity: capacity ? parseInt(capacity) : null,
      price: price ? parseFloat(price) : 0,
      currency: currency || 'INR',
      status: 'Published',
    }, { transaction: t });

    // Handle user-uploaded original event cover image
    let savedImagePath = null;
    if (req.file) {
      savedImagePath = `/uploads/${path.basename(req.file.path)}`;
      await EventImage.create({
        event_id: event.event_id,
        original_image_path: savedImagePath,
        generation_status: 'Completed',
      }, { transaction: t });
    }

    await notificationService.notifyLocalEventPublished(event, location, t);
    await t.commit();

    return res.status(201).json({
      success: true,
      message: `Event "${event.title}" published successfully! 🎉`,
      event_id: event.event_id,
      event: {
        event_id: event.event_id,
        title: event.title,
        city: resolvedCity,
        district: resolvedDistrict,
        state: resolvedState,
        status: event.status,
      },
      city: resolvedCity,
      image_url: savedImagePath,
    });
  } catch (err) {
    await t.rollback();
    console.error('createEvent error:', err);
    return res.status(500).json({ success: false, message: 'Could not create event: ' + err.message });
  }
};

// PATCH /api/events/:id or PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const ev = await Event.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (ev.moderation_status === 'Hidden') {
      const isOwner = req.user && req.user.user_id === ev.organizer_id;
      const isAdmin = req.user && req.user.role === 'Admin';
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ success: false, message: 'This event listing is currently hidden by moderation.' });
      }
    }
    if (ev.organizer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own events.' });
    }

    if (ev.status === 'Cancelled') {
      return res.status(400).json({ success: false, code: 'EVENT_CANCELLED', message: 'Cannot edit an event that has been cancelled.' });
    }

    const now = new Date();
    if (ev.status === 'Completed' || (ev.start_datetime && now >= new Date(ev.start_datetime))) {
      return res.status(400).json({
        success: false,
        code: 'EVENT_ALREADY_STARTED',
        message: 'Cannot edit an event that has already started or completed. Edits are only permitted before the event date.'
      });
    }

    if (req.body.capacity !== undefined) {
      const newCap = parseInt(req.body.capacity, 10);
      if (isNaN(newCap) || newCap < 1) {
        return res.status(400).json({ success: false, message: 'Capacity must be at least 1.' });
      }
      const confirmedCount = await EventRegistration.count({
        where: { event_id: ev.event_id, registration_status: 'Confirmed' }
      });
      if (newCap < confirmedCount) {
        return res.status(400).json({
          success: false,
          code: 'CAPACITY_BELOW_REGISTRATIONS',
          message: `Cannot lower capacity to ${newCap}. There are already ${confirmedCount} confirmed attendee registrations.`
        });
      }
      ev.capacity = newCap;
    }

    const allowed = ['title', 'description', 'start_datetime', 'end_datetime',
                     'registration_deadline', 'price', 'status'];
    allowed.forEach(field => { if (req.body[field] !== undefined) ev[field] = req.body[field]; });

    // Category update
    if (req.body.category_id !== undefined) {
      ev.category_id = req.body.category_id;
    } else if (req.body.category) {
      const cat = await Category.findOne({ where: { name: req.body.category } });
      if (cat) ev.category_id = cat.category_id;
    }

    // Update location if venue fields provided
    if (ev.location_id) {
      const locUpdate = {};
      if (req.body.venue_name) locUpdate.venue_name = req.body.venue_name;
      if (req.body.city) {
        locUpdate.city = resolveCanonicalCity(req.body.city);
        locUpdate.discovery_city = req.body.discovery_city ? resolveCanonicalCity(req.body.discovery_city) : locUpdate.city;
      }
      if (req.body.district) locUpdate.district = req.body.district;
      if (req.body.state) locUpdate.state = req.body.state;
      if (req.body.postal_code) locUpdate.postal_code = req.body.postal_code;
      if (req.body.formatted_address) locUpdate.formatted_address = req.body.formatted_address;
      if (req.body.latitude !== undefined && Number.isFinite(Number(req.body.latitude))) {
        locUpdate.latitude = parseFloat(req.body.latitude);
      }
      if (req.body.longitude !== undefined && Number.isFinite(Number(req.body.longitude))) {
        locUpdate.longitude = parseFloat(req.body.longitude);
      }

      if (Object.keys(locUpdate).length > 0) {
        await Location.update(locUpdate, { where: { location_id: ev.location_id } });
      }
    }

    // Replace or upload new image
    if (req.file) {
      const savedImagePath = `/uploads/${path.basename(req.file.path)}`;
      let img = await EventImage.findOne({ where: { event_id: ev.event_id } });
      if (img) {
        img.original_image_path = savedImagePath;
        img.generation_status = 'Completed';
        await img.save();
      } else {
        await EventImage.create({
          event_id: ev.event_id,
          original_image_path: savedImagePath,
          generation_status: 'Completed'
        });
      }
    }

    await ev.save();

    // Notify registered users if date/venue/title changed
    if (['title', 'description', 'start_datetime', 'end_datetime', 'venue_name', 'city', 'state', 'formatted_address'].some(field => req.body[field] !== undefined)) {
      await notificationService.notifyEventChange(ev.event_id, req.user.user_id);
    }

    return res.json({ success: true, message: 'Event updated successfully!', event: ev });
  } catch (err) {
    console.error('updateEvent error:', err);
    return res.status(500).json({ success: false, message: 'Could not update event.' });
  }
};

// DELETE /api/events/:id or POST /api/events/:id/cancel
const cancelEvent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ev = await Event.findByPk(req.params.id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!ev) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (ev.moderation_status === 'Hidden') {
      const isOwner = req.user && req.user.user_id === ev.organizer_id;
      const isAdmin = req.user && req.user.role === 'Admin';
      if (!isOwner && !isAdmin) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'This event listing is currently hidden by moderation.' });
      }
    }
    if (ev.organizer_id !== req.user.user_id) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'You can only cancel your own events.' });
    }

    if (ev.status === 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ success: false, code: 'ALREADY_CANCELLED', message: 'This event is already cancelled.' });
    }

    const now = new Date();
    if (ev.status === 'Completed' || (ev.start_datetime && now >= new Date(ev.start_datetime))) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        code: 'EVENT_ALREADY_STARTED',
        message: 'Cannot cancel an event that has already started or completed. Cancellations are only permitted before the event date.'
      });
    }

    ev.status = 'Cancelled';
    await ev.save({ transaction: t });

    // Find all confirmed/pending registrations to cancel and refund
    const registrations = await EventRegistration.findAll({
      where: {
        event_id: ev.event_id,
        registration_status: { [Op.in]: ['Confirmed', 'Pending'] }
      },
      include: [
        { model: Payment, as: 'payment' },
        { model: User, as: 'user', attributes: ['user_id', 'name', 'email'] }
      ],
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    const refundedUsers = [];
    let totalRefundedAmount = 0;

    for (const reg of registrations) {
      // Invalidate ticket pass
      await EventTicket.update(
        { ticket_status: 'Cancelled', invalidated_at: new Date() },
        { where: { registration_id: reg.registration_id }, transaction: t }
      );

      // Cancel registration
      reg.registration_status = 'Cancelled';
      reg.cancelled_at = new Date();
      await reg.save({ transaction: t });

      // Automatically refund payment if completed
      if (reg.payment && reg.payment.status === 'Completed') {
        const refundRef = `rfnd_evtcancel_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        reg.payment.status = 'Refunded';
        await reg.payment.save({ transaction: t });

        const refundAmt = parseFloat(reg.payment.amount) || 0;
        totalRefundedAmount += refundAmt;

        refundedUsers.push({
          user_id: reg.user_id,
          amount: refundAmt,
          refund_id: refundRef,
          user_name: reg.user ? reg.user.name : 'Attendee',
          is_paid: true
        });
      } else {
        refundedUsers.push({
          user_id: reg.user_id,
          amount: 0,
          user_name: reg.user ? reg.user.name : 'Attendee',
          is_paid: false
        });
      }
    }

    await t.commit();

    // Post-commit notifications
    for (const r of refundedUsers) {
      if (r.is_paid) {
        await notificationService.notify(
          r.user_id,
          'refund_processed',
          'Event Cancelled — 100% Refund Issued 💸',
          `"${ev.title}" was cancelled by the organizer. A 100% full refund of ₹${r.amount.toFixed(2)} has been initiated to your original payment method (Ref: ${r.refund_id}).`,
          ev.event_id
        );
      } else {
        await notificationService.notify(
          r.user_id,
          'event_cancelled',
          'Event Cancelled by Organizer ⚠️',
          `We're sorry, "${ev.title}" has been cancelled by the organizer. Your booking has been cancelled and digital pass invalidated.`,
          ev.event_id
        );
      }
    }

    const paidCount = refundedUsers.filter(r => r.is_paid).length;
    const message = paidCount > 0
      ? `Event "${ev.title}" successfully cancelled. All ${registrations.length} pass(es) invalidated and 100% full refunds processed for ${paidCount} paid attendee(s) totaling ₹${totalRefundedAmount.toFixed(2)}.`
      : `Event "${ev.title}" successfully cancelled and all ${registrations.length} registered attendee(s) notified.`;

    return res.json({
      success: true,
      message,
      event_id: ev.event_id,
      status: 'Cancelled',
      total_registrations_cancelled: registrations.length,
      refunds_processed: paidCount,
      total_refunded_amount: totalRefundedAmount
    });
  } catch (err) {
    await t.rollback();
    console.error('cancelEvent error:', err);
    return res.status(500).json({ success: false, message: 'Could not cancel event.' });
  }
};

// GET /api/events/nearby
const getNearbyEvents = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 12 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required.' });
    if (![lat, lng, radius].every(value => Number.isFinite(Number(value))) ||
        Math.abs(Number(lat)) > 90 || Math.abs(Number(lng)) > 180 || Number(radius) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid latitude, longitude and a positive radius are required.' });
    }

    const R = 6371; // Earth radius km
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const distanceExpr = literal(
      `(${R} * ACOS(COS(RADIANS(${parseFloat(lat)})) * COS(RADIANS(\`location\`.\`latitude\`)) * COS(RADIANS(\`location\`.\`longitude\`) - RADIANS(${parseFloat(lng)})) + SIN(RADIANS(${parseFloat(lat)})) * SIN(RADIANS(\`location\`.\`latitude\`))))`
    );

    const { count, rows } = await Event.findAndCountAll({
      where: { status: 'Published', moderation_status: 'Approved' },
      include: [
        { model: Category, as: 'category', attributes: ['category_id', 'name', 'slug', 'icon'] },
        {
          model: Location, as: 'location',
          where: literal(`(${R} * ACOS(COS(RADIANS(${parseFloat(lat)})) * COS(RADIANS(\`location\`.\`latitude\`)) * COS(RADIANS(\`location\`.\`longitude\`) - RADIANS(${parseFloat(lng)})) + SIN(RADIANS(${parseFloat(lat)})) * SIN(RADIANS(\`location\`.\`latitude\`)))) <= ${parseFloat(radius)}`),
        },
        { model: User, as: 'organizer', attributes: ['user_id', 'name'] },
        { model: EventImage, as: 'images', limit: 1 },
      ],
      attributes: { include: [[distanceExpr, 'distance']] },
      order: [[literal('distance'), 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
      subQuery: false,
    });

    return res.json({
      success: true,
      events: rows.map(e => ({ ...formatEventCard(e), distance_km: parseFloat(e.dataValues.distance || 0).toFixed(1) })),
      total: count,
    });
  } catch (err) {
    console.error('getNearbyEvents error:', err);
    return res.status(500).json({ success: false, message: 'Could not load nearby events.' });
  }
};

// GET /api/organizer/events  (organizer's own events, past & present)
const getMyEvents = async (req, res) => {
  try {
    await reconcileEventStatuses();

    const events = await Event.findAll({
      where: { organizer_id: req.user.user_id },
      include: [
        { model: Category, as: 'category', attributes: ['name', 'icon'] },
        { model: Location, as: 'location' },
        { model: EventImage, as: 'images', limit: 1 },
        { model: EventRegistration, as: 'registrations', attributes: ['registration_id', 'registration_status'] },
      ],
      order: [['start_datetime', 'DESC']],
    });

    return res.json({
      success: true,
      events: events.map(ev => ({
        ...formatEventCard(ev),
        registration_count: ev.registrations ? ev.registrations.filter(r => r.registration_status === 'Confirmed').length : 0,
      })),
    });
  } catch (err) {
    console.error('getMyEvents error:', err);
    return res.status(500).json({ success: false, message: 'Could not load your events.' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  getNearbyEvents,
  getMyEvents,
  reconcileEventStatuses
};
