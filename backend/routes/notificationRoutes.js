'use strict';
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markRead,
  markAllRead,
} = require('../controllers/notificationController');

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
