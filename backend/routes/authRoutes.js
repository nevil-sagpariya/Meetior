'use strict';
const express = require('express');
const router  = express.Router();
const { register, login, logout, getMe, updateProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(e => e.msg).join(' ');
    return res.status(422).json({ success: false, message: errorMsg, errors: errors.array() });
  }
  next();
};

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
  body('email').isEmail().withMessage('Invalid email address.'),
  body('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/).withMessage('Password must be 8+ chars with uppercase, lowercase, and digit.'),
  body('role').isIn(['Attendee', 'Organizer']).withMessage('Role must be Attendee or Organizer.'),
  body('phone_number').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/).withMessage('Phone number must be a valid 10-digit Indian mobile number.')
], validate, register);

router.post('/login', [
  body('email').custom((val) => {
    if (!val || typeof val !== 'string') throw new Error('Email or mobile number is required.');
    const trimmed = val.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
    const isPhone = /^[6-9]\d{9}$/.test(trimmed);
    if (!isEmail && !isPhone) {
      throw new Error('Please enter a valid email address or 10-digit mobile number.');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required.'),
], validate, login);

router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.patch('/profile', authMiddleware, upload.single('profile_image'), updateProfile);
router.put('/profile', authMiddleware, upload.single('profile_image'), updateProfile);

module.exports = router;
