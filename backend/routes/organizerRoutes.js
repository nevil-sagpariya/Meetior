'use strict';
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireOrganizer } = require('../middleware/roleMiddleware');
const { checkIn, getAttendance } = require('../controllers/checkinController');
const { getMyEvents } = require('../controllers/eventController');
const { getOrganizerPayments } = require('../controllers/paymentController');

router.use(authMiddleware, requireOrganizer);

router.get('/events', getMyEvents);
router.get('/payments', getOrganizerPayments);
router.post('/events/:id/check-in', checkIn);
router.get('/events/:id/attendance', getAttendance);

module.exports = router;
