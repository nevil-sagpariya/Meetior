'use strict';

const { EventReview, EventCheckIn, EventTicket, EventRegistration, User, Event } = require('../models');

// GET /api/events/:id/reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await EventReview.findAll({
      where: { event_id: parseInt(req.params.id), status: 'approved' },
      include: [{ model: User, as: 'reviewer', attributes: ['name', 'profile_image'] }],
      order: [['created_at', 'DESC']],
    });
    const avg = reviews.length
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
      : null;
    return res.json({ success: true, reviews, avg_rating: avg, count: reviews.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load reviews.' });
  }
};

// POST /api/events/:id/reviews
const createReview = async (req, res) => {
  try {
    const event_id = parseInt(req.params.id);
    const user_id = req.user.user_id;

    // Only checked-in attendees can review
    const checkin = await EventCheckIn.findOne({
      where: { event_id },
      include: [{
        model: EventTicket, as: 'ticket', required: true,
        include: [{ model: EventRegistration, as: 'registration', where: { user_id } }],
      }],
    });

    if (!checkin) {
      return res.status(403).json({
        success: false,
        message: 'Only attendees who were checked in at this event can leave a review.',
      });
    }

    const existing = await EventReview.findOne({ where: { event_id, user_id } });
    if (existing) return res.status(409).json({ success: false, message: 'You have already reviewed this event.' });

    const review = await EventReview.create({
      event_id, user_id,
      rating: req.body.rating,
      comment: req.body.comment || null,
    });

    return res.status(201).json({ success: true, message: 'Thank you for your feedback! 🌟', review });
  } catch (err) {
    console.error('createReview error:', err);
    return res.status(500).json({ success: false, message: 'Could not submit review.' });
  }
};

// PATCH /api/events/:id/reviews/:reviewId
const updateReview = async (req, res) => {
  try {
    const review = await EventReview.findByPk(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    if (review.user_id !== req.user.user_id) return res.status(403).json({ success: false, message: 'You can only edit your own review.' });

    if (req.body.rating !== undefined) review.rating = req.body.rating;
    if (req.body.comment !== undefined) review.comment = req.body.comment;
    await review.save();

    return res.json({ success: true, message: 'Review updated.', review });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not update review.' });
  }
};

module.exports = { getReviews, createReview, updateReview };
