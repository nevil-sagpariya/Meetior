'use strict';

const {
  SecondChanceRequest, SecondChanceResponse, Event,
  User, Notification, Category, Location, EventImage, sequelize,
} = require('../models');
const notificationService = require('../services/notificationService');

// POST /api/events/:id/second-chance
const submitRequest = async (req, res) => {
  try {
    const original_event_id = parseInt(req.params.id);
    const user_id = req.user.user_id;

    const ev = await Event.findByPk(original_event_id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (ev.status !== 'Completed' && ev.status !== 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Second Chance can only be requested for completed or cancelled events.' });
    }

    const [record, created] = await SecondChanceRequest.findOrCreate({
      where: { original_event_id, user_id },
      defaults: { original_event_id, user_id, message: req.body.message || null },
    });

    if (!created) return res.status(409).json({ success: false, message: 'You have already submitted a request for this event.' });

    return res.status(201).json({ success: true, message: 'Second Chance request submitted! The organizer will be notified.', request: record });
  } catch (err) {
    console.error('submitRequest error:', err);
    return res.status(500).json({ success: false, message: 'Could not submit request.' });
  }
};

// GET /api/events/:id/second-chance
const getRequests = async (req, res) => {
  try {
    const event_id = parseInt(req.params.id);
    const requests = await SecondChanceRequest.findAll({
      where: { original_event_id: event_id },
      include: [{ model: User, as: 'user', attributes: ['name'] }],
      order: [['created_at', 'DESC']],
    });
    const response = await SecondChanceResponse.findOne({ where: { original_event_id: event_id } });
    return res.json({ success: true, requests, total: requests.length, organizer_response: response });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load requests.' });
  }
};

// PATCH /api/events/:id/second-chance/response
const updateResponse = async (req, res) => {
  try {
    const original_event_id = parseInt(req.params.id);
    const ev = await Event.findByPk(original_event_id);
    if (!ev || ev.organizer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Only the event organizer can respond.' });
    }

    const [resp] = await SecondChanceResponse.upsert({
      original_event_id,
      organizer_id: req.user.user_id,
      status: req.body.status,
      response_message: req.body.response_message,
    });

    // Notify requesters
    const requesters = await SecondChanceRequest.findAll({ where: { original_event_id }, attributes: ['user_id'] });
    for (const r of requesters) {
      await notificationService.notify(
        r.user_id, 'second_chance_update', `Organizer responded to "${ev.title}" Second Chance`,
        `Status: ${req.body.status}. ${req.body.response_message || ''}`,
        original_event_id
      );
    }

    return res.json({ success: true, message: 'Response updated.', response: resp });
  } catch (err) {
    console.error('updateResponse error:', err);
    return res.status(500).json({ success: false, message: 'Could not update response.' });
  }
};

// POST /api/events/:id/new-session
const createNewSession = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const original_event_id = parseInt(req.params.id);
    const original = await Event.findByPk(original_event_id, { transaction: t });
    if (!original || original.organizer_id !== req.user.user_id) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const newEvent = await Event.create({
      organizer_id: req.user.user_id,
      category_id: original.category_id,
      location_id: original.location_id,
      original_event_id,
      title: req.body.title || `${original.title} – New Session`,
      description: req.body.description || original.description,
      start_datetime: req.body.start_datetime,
      end_datetime: req.body.end_datetime,
      capacity: req.body.capacity || original.capacity,
      price: req.body.price !== undefined ? req.body.price : original.price,
      currency: original.currency,
      status: 'Published',
    }, { transaction: t });

    // Link response
    await SecondChanceResponse.upsert({
      original_event_id,
      organizer_id: req.user.user_id,
      status: 'Planning',
      new_session_event_id: newEvent.event_id,
    }, { transaction: t });

    await t.commit();

    // Notify requesters
    const requesters = await SecondChanceRequest.findAll({ where: { original_event_id }, attributes: ['user_id'] });
    for (const r of requesters) {
      await notificationService.notify(
        r.user_id, 'new_session_created', `New session announced for "${original.title}"!`,
        `The organizer has scheduled a new session. Register now!`,
        newEvent.event_id
      );
    }

    return res.status(201).json({ success: true, message: 'New session created and requesters notified!', event_id: newEvent.event_id });
  } catch (err) {
    await t.rollback();
    console.error('createNewSession error:', err);
    return res.status(500).json({ success: false, message: 'Could not create new session.' });
  }
};

module.exports = { submitRequest, getRequests, updateResponse, createNewSession };
