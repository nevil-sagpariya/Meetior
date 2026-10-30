'use strict';

/**
 * Reminder Worker – runs on a schedule using node-cron.
 * Generates in-app notifications for:
 * - Confirmed registrants: 2d, 1d, 2h before event
 * - Saved-event users (unregistered): event approaching, 1d, deadline closing
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const {
  Event, EventRegistration, EventInteraction, NotificationDelivery,
} = require('../models');
const notificationService = require('../services/notificationService');

const CONFIRMED_OFFSETS = [
  { label: '2d', hours: 48, title: 'Your event is in 2 days! 📅', msgTpl: (t) => `"${t}" starts in 2 days. View your Event Pass.` },
  { label: '1d', hours: 24, title: 'Your event is tomorrow! ⏰',  msgTpl: (t) => `"${t}" is tomorrow! Don't forget your Event Pass.` },
  { label: '2h', hours: 2,  title: 'Your event starts in 2 hours! 🚀', msgTpl: (t) => `"${t}" starts in 2 hours. Get ready!` },
];

const SAVED_OFFSETS = [
  { label: '3d', hours: 72, title: 'Saved event approaching! 📌', msgTpl: (t) => `You saved "${t}". It's in 3 days – register before it fills up!` },
  { label: '1d', hours: 24, title: 'Saved event is tomorrow! 🌟', msgTpl: (t) => `You saved "${t}" – it's tomorrow! Register now.` },
];

const dedupeKey = (userId, eventId, type, offset) => `${userId}:${eventId}:${type}:${offset}`;

const sendIfNotSent = async (userId, eventId, type, offset, scheduledFor, title, message) => {
  const key = dedupeKey(userId, eventId, type, offset);
  const existing = await NotificationDelivery.findOne({ where: { deduplication_key: key } });
  if (existing) return; // Already delivered

  await NotificationDelivery.create({
    user_id: userId,
    event_id: eventId,
    notification_type: type,
    reminder_offset: offset,
    scheduled_for: scheduledFor,
    delivered_at: new Date(),
    status: 'Delivered',
    deduplication_key: key,
  });

  await notificationService.notify(userId, type, title, message, eventId);
};

const processReminders = async () => {
  try {
    const { reconcileEventStatuses } = require('../controllers/eventController');
    await reconcileEventStatuses();

    const now = new Date();

    // ── Confirmed booking reminders ──
    for (const offset of CONFIRMED_OFFSETS) {
      const windowStart = new Date(now.getTime() + offset.hours * 3600000 - 300000); // 5 min before window
      const windowEnd   = new Date(now.getTime() + offset.hours * 3600000 + 300000);

      const upcoming = await Event.findAll({
        where: {
          status: 'Published',
          start_datetime: { [Op.between]: [windowStart, windowEnd] },
        },
        attributes: ['event_id', 'title', 'start_datetime'],
      });

      for (const ev of upcoming) {
        const regs = await EventRegistration.findAll({
          where: { event_id: ev.event_id, registration_status: 'Confirmed' },
          attributes: ['user_id'],
        });
        for (const r of regs) {
          await sendIfNotSent(
            r.user_id, ev.event_id,
            `booking_reminder_${offset.label}`, offset.label,
            ev.start_datetime,
            offset.title,
            offset.msgTpl(ev.title)
          );
        }
      }
    }

    // ── Saved event reminders ──
    for (const offset of SAVED_OFFSETS) {
      const windowStart = new Date(now.getTime() + offset.hours * 3600000 - 300000);
      const windowEnd   = new Date(now.getTime() + offset.hours * 3600000 + 300000);

      const upcoming = await Event.findAll({
        where: {
          status: 'Published',
          start_datetime: { [Op.between]: [windowStart, windowEnd] },
        },
        attributes: ['event_id', 'title', 'start_datetime'],
      });

      for (const ev of upcoming) {
        // Find users who saved but are NOT confirmed registrants
        const savers = await EventInteraction.findAll({
          where: { event_id: ev.event_id, interaction_type: 'Saved' },
          attributes: ['user_id'],
        });
        for (const s of savers) {
          const confirmed = await EventRegistration.findOne({
            where: { event_id: ev.event_id, user_id: s.user_id, registration_status: 'Confirmed' },
          });
          if (confirmed) continue; // Already registered – skip

          await sendIfNotSent(
            s.user_id, ev.event_id,
            `saved_reminder_${offset.label}`, offset.label,
            ev.start_datetime,
            offset.title,
            offset.msgTpl(ev.title)
          );
        }
      }
    }
  } catch (err) {
    console.error('Reminder worker error:', err);
  }
};

// Run every 5 minutes
const startReminderWorker = () => {
  console.log('⏰ Reminder worker started (runs every 5 minutes)');
  cron.schedule('*/5 * * * *', processReminders);
};

module.exports = { startReminderWorker, processReminders };
