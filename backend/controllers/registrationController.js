'use strict';

const { Op } = require('sequelize');
const crypto = require('crypto');
const QRCode = require('qrcode');
const {
  Event, EventRegistration, EventTicket, Payment, User,
  Location, Category, EventImage, Notification, PlatformSetting, sequelize,
} = require('../models');
const notificationService = require('../services/notificationService');
const { createTicketQrToken, hashQrToken } = require('../utils/ticketQr');

// Unique ticket number format: MTR-YYYYMMDD-XXXXXX
const genTicketNumber = () => {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MTR-${date}-${rand}`;
};

// Cryptographically secure QR token
const issueTicket = async (registration_id, transaction) => {
  const ticketNumber = genTicketNumber();

  // Check if ticket record already exists for this registration (e.g. re-registration after cancel)
  let ticket = await EventTicket.findOne({ where: { registration_id }, transaction });
  const priorIssuedAt = ticket?.issued_at ? new Date(ticket.issued_at).getTime() : 0;
  const issuedAt = new Date(Math.max(Date.now(), priorIssuedAt + 1000));
  if (ticket) {
    ticket.public_ticket_number = ticketNumber;
    ticket.qr_token_hash = crypto.randomBytes(32).toString('hex');
    ticket.ticket_status = 'Valid';
    ticket.issued_at = issuedAt;
    await ticket.save({ transaction });
  } else {
    ticket = await EventTicket.create({
      registration_id,
      public_ticket_number: ticketNumber,
      qr_token_hash: crypto.randomBytes(32).toString('hex'),
      ticket_status: 'Valid',
      issued_at: issuedAt,
    }, { transaction });
  }

  await ticket.reload({ transaction });
  const qrRaw = createTicketQrToken(ticket);
  ticket.qr_token_hash = hashQrToken(qrRaw);
  await ticket.save({ transaction });
  const qrDataUrl = await QRCode.toDataURL(qrRaw);

  return { ticket, qrDataUrl, qrRaw };
};

// POST /api/events/:id/register
const registerForEvent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const event_id = parseInt(req.params.id);
    const user_id  = req.user.user_id;

    // Load event with lock
    const ev = await Event.findByPk(event_id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!ev) { await t.rollback(); return res.status(404).json({ success: false, message: 'Event not found.' }); }

    if (ev.status === 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'This event has been cancelled.' });
    }
    if (ev.status === 'Completed' || (ev.end_datetime && new Date() > new Date(ev.end_datetime))) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'This event has already ended or been completed.' });
    }
    if (ev.registration_deadline && new Date() > new Date(ev.registration_deadline)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Registration deadline has passed.' });
    }

    // Capacity check
    if (ev.capacity) {
      const confirmed = await EventRegistration.count({
        where: { event_id, registration_status: 'Confirmed' },
        transaction: t,
      });
      if (confirmed >= ev.capacity) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Sorry, this event is full.' });
      }
    }

    // Duplicate check
    const existing = await EventRegistration.findOne({ where: { user_id, event_id }, transaction: t });
    if (existing && existing.registration_status !== 'Cancelled') {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'You are already registered for this event.' });
    }

    const isFree = parseFloat(ev.price) === 0;

    if (existing && existing.registration_status === 'Cancelled') {
      // Re-register
      existing.registration_status = isFree ? 'Confirmed' : 'Pending';
      existing.cancelled_at = null;
      existing.registered_at = new Date();
      await existing.save({ transaction: t });
    }

    const reg = existing || await EventRegistration.create({
      user_id,
      event_id,
      registration_status: isFree ? 'Confirmed' : 'Pending',
    }, { transaction: t });

    if (isFree) {
      const { ticket, qrDataUrl } = await issueTicket(reg.registration_id, t);
      await t.commit();

      await notificationService.notify(user_id, 'registration_confirmed', 'Registration Confirmed! 🎉',
        `You're registered for "${ev.title}". Your Event Pass is ready!`, event_id);

      return res.status(201).json({
        success: true,
        message: `Registered for "${ev.title}"! Your pass is ready.`,
        registration_id: reg.registration_id,
        ticket_number: ticket.public_ticket_number,
        qr_code: qrDataUrl,
      });
    } else {
      // Paid – create Razorpay order
      await t.commit();
      return res.json({
        success: true,
        message: 'Proceed to payment.',
        registration_id: reg.registration_id,
        amount: ev.price,
        currency: ev.currency,
        requires_payment: true,
      });
    }
  } catch (err) {
    await t.rollback();
    console.error('registerForEvent error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// DELETE /api/events/:id/registration
const cancelRegistration = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const reg = await EventRegistration.findOne({
      where: { user_id: req.user.user_id, event_id: parseInt(req.params.id) },
      include: [
        { model: Event, as: 'event', attributes: ['event_id', 'title', 'price', 'start_datetime', 'end_datetime', 'status'] },
        { model: Payment, as: 'payment' },
      ],
      transaction: t,
    });
    if (!reg) { await t.rollback(); return res.status(404).json({ success: false, message: 'Registration not found.' }); }

    if (reg.registration_status === 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'This booking has already been cancelled.' });
    }

    // Cancellation Policy Enforcement:
    // 1. Cannot cancel after event has happened or already started
    // 2. Cannot cancel within 24 hours (1 day) of the event start time
    const now = new Date();
    const eventStartTime = reg.event?.start_datetime ? new Date(reg.event.start_datetime) : null;
    const eventEndTime = reg.event?.end_datetime ? new Date(reg.event.end_datetime) : null;

    if (eventStartTime) {
      if (now >= eventStartTime || reg.event?.status === 'Completed' || reg.event?.status === 'Ongoing' || (eventEndTime && now >= eventEndTime)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          code: 'EVENT_ALREADY_STARTED',
          message: 'Cancellation closed: Passes cannot be cancelled after the event has already started or completed.'
        });
      }

      const msUntilEvent = eventStartTime.getTime() - now.getTime();
      const hoursUntilEvent = msUntilEvent / (1000 * 60 * 60);

      let cutoffHours = 24;
      try {
        const setting = await PlatformSetting.findOne({
          where: {
            setting_key: { [Op.in]: ['cancellation_cutoff_hours', 'max_booking_cancellation_hours'] }
          },
          transaction: t
        });
        if (setting && !isNaN(Number(setting.setting_value))) {
          cutoffHours = Number(setting.setting_value);
        }
      } catch (_) {}

      if (hoursUntilEvent < cutoffHours) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          code: 'CANCELLATION_DEADLINE_PASSED',
          message: `Cancellation closed: Cancellations and refunds are locked within ${cutoffHours} hours of the event start time to protect organizer commitments.`
        });
      }
    }

    reg.registration_status = 'Cancelled';
    reg.cancelled_at = new Date();
    await reg.save({ transaction: t });

    // Invalidate ticket
    await EventTicket.update(
      { ticket_status: 'Cancelled', invalidated_at: new Date() },
      { where: { registration_id: reg.registration_id }, transaction: t }
    );

    let refundInfo = null;
    let payment = reg.payment;
    if (!payment) {
      payment = await Payment.findOne({ where: { registration_id: reg.registration_id }, transaction: t });
    }

    if (payment && payment.status === 'Completed') {
      const refundRef = `rfnd_wallet_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      payment.status = 'Refunded';
      await payment.save({ transaction: t });

      refundInfo = {
        amount: parseFloat(payment.amount),
        currency: payment.currency || 'INR',
        refund_id: refundRef,
        status: 'Processed',
        eta: 'Instant Demo Wallet Credit'
      };
    }

    await t.commit();

    if (refundInfo) {
      await notificationService.notify(
        req.user.user_id,
        'refund_processed',
        'Refund Processed 💸',
        `Your pass for "${reg.event?.title || 'Meetior Event'}" was cancelled. Full refund of ₹${refundInfo.amount} has been initiated to your original payment method (Ref: ${refundInfo.refund_id}).`,
        reg.event_id
      );
    }

    const message = refundInfo 
      ? `Registration cancelled. 100% refund of ₹${refundInfo.amount} initiated (Ref: ${refundInfo.refund_id}).`
      : 'Registration cancelled and digital pass invalidated.';

    return res.json({ 
      success: true, 
      message,
      event_title: reg.event?.title || 'Meetior Event',
      refund: refundInfo
    });
  } catch (err) {
    await t.rollback();
    console.error('cancelRegistration error:', err);
    return res.status(500).json({ success: false, message: 'Could not cancel registration.' });
  }
};

// GET /api/users/me/bookings
const getMyBookings = async (req, res) => {
  try {
    const regs = await EventRegistration.findAll({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: Event, as: 'event',
          include: [
            { model: Category, as: 'category', attributes: ['name', 'icon'] },
            { model: Location, as: 'location' },
            { model: EventImage, as: 'images', limit: 1 },
          ],
        },
        { model: EventTicket, as: 'ticket' },
        { model: Payment, as: 'payment' },
      ],
      order: [['registered_at', 'DESC']],
    });
    return res.json({ success: true, bookings: regs });
  } catch (err) {
    console.error('getMyBookings error:', err);
    return res.status(500).json({ success: false, message: 'Could not load bookings.' });
  }
};

// GET /api/events/:id/registrations  (organizer only)
const getEventRegistrations = async (req, res) => {
  try {
    const ev = await Event.findByPk(req.params.id);
    if (!ev || ev.organizer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const regs = await EventRegistration.findAll({
      where: { event_id: parseInt(req.params.id) },
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'email', 'city'] },
        { model: EventTicket, as: 'ticket' },
        { model: Payment, as: 'payment' },
      ],
      order: [['registered_at', 'ASC']],
    });
    return res.json({ success: true, registrations: regs });
  } catch (err) {
    console.error('getEventRegistrations error:', err);
    return res.status(500).json({ success: false, message: 'Could not load registrations.' });
  }
};

// GET /api/tickets/:id
const getTicket = async (req, res) => {
  try {
    const ticket = await EventTicket.findByPk(req.params.id, {
      include: [{
        model: EventRegistration, as: 'registration',
        include: [
          { model: Event, as: 'event', include: [{ model: Location, as: 'location' }] },
          { model: User, as: 'user', attributes: ['name', 'email'] },
          { model: Payment, as: 'payment' },
        ],
      }],
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const reg = ticket.registration;
    if (!reg || reg.user_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Generate fresh QR data URL from the stored hash would expose the secret.
    // Instead, re-generate a QR code encoding the ticket_id + a HMAC for display.
    const qrPayload = createTicketQrToken(ticket);
    const qrDataUrl = await QRCode.toDataURL(qrPayload);

    return res.json({ success: true, ticket, qr_code: qrDataUrl });
  } catch (err) {
    console.error('getTicket error:', err);
    return res.status(500).json({ success: false, message: 'Could not load ticket.' });
  }
};

module.exports = { registerForEvent, cancelRegistration, getMyBookings, getEventRegistrations, getTicket };
