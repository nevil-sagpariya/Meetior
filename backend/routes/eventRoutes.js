'use strict';
const express = require('express');
const router  = express.Router();
const {
  getEvents, getEventById, createEvent, updateEvent, cancelEvent, getNearbyEvents, getMyEvents,
} = require('../controllers/eventController');
const {
  putGoing, deleteGoing, putInterested, deleteInterested, putSave, deleteSave,
} = require('../controllers/interactionController');
const { registerForEvent, cancelRegistration, getEventRegistrations } = require('../controllers/registrationController');
const { submitRequest, getRequests, updateResponse, createNewSession } = require('../controllers/secondChanceController');
const { getReviews, createReview, updateReview } = require('../controllers/reviewController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { requireOrganizer, requireAttendee } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public event listing & nearby
router.get('/nearby',  optionalAuth, getNearbyEvents);
router.get('/',        optionalAuth, getEvents);
router.get('/:id',     optionalAuth, getEventById);

// Organizer CRUD
router.post('/',       authMiddleware, requireOrganizer, upload.single('image'), createEvent);
router.patch('/:id',   authMiddleware, requireOrganizer, upload.single('image'), updateEvent);
router.put('/:id',     authMiddleware, requireOrganizer, upload.single('image'), updateEvent);
router.delete('/:id',  authMiddleware, requireOrganizer, cancelEvent);
router.post('/:id/cancel', authMiddleware, requireOrganizer, cancelEvent);

// Interactions (require login, either role)
router.put('/:id/going',       authMiddleware, putGoing);
router.delete('/:id/going',    authMiddleware, deleteGoing);
router.put('/:id/interested',  authMiddleware, putInterested);
router.delete('/:id/interested', authMiddleware, deleteInterested);
router.put('/:id/save',        authMiddleware, putSave);
router.delete('/:id/save',     authMiddleware, deleteSave);
router.put('/:id/saved',       authMiddleware, putSave);
router.delete('/:id/saved',    authMiddleware, deleteSave);

// Registration
router.post('/:id/register',     authMiddleware, registerForEvent);
router.delete('/:id/registration', authMiddleware, cancelRegistration);
router.get('/:id/registrations', authMiddleware, requireOrganizer, getEventRegistrations);

// Second Chance
router.post('/:id/second-chance',           authMiddleware, submitRequest);
router.get('/:id/second-chance',            optionalAuth,  getRequests);
router.patch('/:id/second-chance/response', authMiddleware, requireOrganizer, updateResponse);
router.post('/:id/new-session',             authMiddleware, requireOrganizer, createNewSession);

// Reviews
router.get('/:id/reviews',           optionalAuth, getReviews);
router.post('/:id/reviews',          authMiddleware, createReview);
router.patch('/:id/reviews/:reviewId', authMiddleware, updateReview);

module.exports = router;
