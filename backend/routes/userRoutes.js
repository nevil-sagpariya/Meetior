'use strict';
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getSavedEvents } = require('../controllers/interactionController');
const { getMyBookings } = require('../controllers/registrationController');
const { getMyEvents } = require('../controllers/eventController');

router.get('/me/saved-events', authMiddleware, getSavedEvents);
router.get('/me/bookings', authMiddleware, getMyBookings);
router.get('/me/events', authMiddleware, getMyEvents);

module.exports = router;
