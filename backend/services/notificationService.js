'use strict';

const { Notification, User } = require('../models');

// Insert with the event transaction: either publication and its inbox messages
// both commit, or neither does. A duplicate create request returns before here.
const notifyLocalEventPublished = async (event, location, transaction) => {
  const { Op, fn, col, where } = require('sequelize');
  const recipients = await User.findAll({
    where: {
      role: 'Attendee', account_status: 'active',
      [Op.and]: [
        where(fn('LOWER', fn('TRIM', col('city'))), location.city.trim().toLowerCase()),
        where(fn('LOWER', fn('TRIM', col('state'))), location.state.trim().toLowerCase())
      ]
    }, attributes: ['user_id'], transaction
  });
  if (recipients.length) await Notification.bulkCreate(recipients.map(user => ({
    user_id: user.user_id, notification_type: 'new_local_event',
    title: `New event in ${location.city}`,
    message: `${event.title} has been published in ${location.city}. View the event to register.`,
    related_event_id: event.event_id, is_read: false
  })), { transaction });
};

/**
 * Create an in-app notification.
 */
const notify = async (user_id, type, title, message, related_event_id = null, related_demand_id = null) => {
  try {
    await Notification.create({
      user_id,
      notification_type: type,
      title,
      message,
      related_event_id,
      related_demand_id,
      is_read: false,
    });
  } catch (err) {
    console.error('notificationService.notify error:', err);
  }
};

/**
 * Notify all confirmed registrants of an event date/venue change.
 */
const notifyEventChange = async (event_id, organizer_id) => {
  try {
    const { EventRegistration, Event } = require('../models');
    const ev = await Event.findByPk(event_id);
    const regs = await EventRegistration.findAll({
      where: { event_id, registration_status: 'Confirmed' },
      attributes: ['user_id'],
    });
    for (const r of regs) {
      if (r.user_id !== organizer_id) {
        await notify(r.user_id, 'event_updated', `Event Updated: "${ev?.title}"`,
          `The details of "${ev?.title}" have been updated. Please check your booking.`, event_id);
      }
    }
  } catch (err) {
    console.error('notifyEventChange error:', err);
  }
};

/**
 * Notify all confirmed registrants when an event is cancelled.
 */
const notifyEventCancelled = async (event_id) => {
  try {
    const { EventRegistration, Event } = require('../models');
    const ev = await Event.findByPk(event_id);
    const regs = await EventRegistration.findAll({
      where: { event_id, registration_status: 'Confirmed' },
      attributes: ['user_id'],
    });
    for (const r of regs) {
      await notify(r.user_id, 'event_cancelled', `Event Cancelled: "${ev?.title}"`,
        `We're sorry, "${ev?.title}" has been cancelled by the organizer.`, event_id);
    }
  } catch (err) {
    console.error('notifyEventCancelled error:', err);
  }
};

module.exports = { notify, notifyEventChange, notifyEventCancelled, notifyLocalEventPublished };
