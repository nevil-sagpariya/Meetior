'use strict';

const { Notification } = require('../models');

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.user_id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const unread = notifications.filter(n => !n.is_read).length;
    return res.json({ success: true, notifications, unread_count: unread });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load notifications.' });
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { notification_id: req.params.id, user_id: req.user.user_id } }
    );
    return res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not mark as read.' });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.user_id } });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not update notifications.' });
  }
};

module.exports = { getNotifications, markRead, markAllRead };
