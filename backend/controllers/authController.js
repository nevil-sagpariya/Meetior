'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { resolveCanonicalCity } = require('../utils/cityResolver');

const generateToken = (user) =>
  jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, city, district, state, pincode, phone_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const canonicalCity = city ? resolveCanonicalCity(city) : 'Ahmedabad';
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phone_number ? phone_number.trim() : null,
      password_hash,
      role: role || 'Attendee',
      city: canonicalCity,
      district: district ? district.trim() : canonicalCity,
      state: state || 'Gujarat',
      pincode: pincode || null,
    });

    const token = generateToken(user);
    return res.status(201).json({
      success: true,
      message: `Welcome to Meetior, ${user.name}! 🎉`,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        city: resolveCanonicalCity(user.city),
        district: user.district,
        state: user.state,
        pincode: user.pincode,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email or phone number and password are required.' });
    }

    const trimmed = (email || '').trim();
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: trimmed.toLowerCase() },
          { phone_number: trimmed }
        ]
      }
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect email/phone number or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    if (user.account_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      message: `Welcome back, ${user.name}! 🌟`,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        account_status: user.account_status,
        city: resolveCanonicalCity(user.city),
        district: user.district,
        state: user.state,
        pincode: user.pincode,
        profile_image: user.profile_image,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// POST /api/auth/logout
const logout = (_req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findByPk(req.user.user_id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  return res.json({
    success: true,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      account_status: user.account_status,
      city: resolveCanonicalCity(user.city),
      district: user.district,
      state: user.state,
      pincode: user.pincode,
      profile_image: user.profile_image,
      created_at: user.created_at,
    },
  });
};

// PATCH /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone_number, city, district, state, pincode } = req.body;
    const user = await User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name) user.name = name.trim();
    if (phone_number !== undefined) user.phone_number = phone_number ? phone_number.trim() : null;
    if (email && email.trim().toLowerCase() !== user.email) {
      const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use by another account.' });
      }
      user.email = email.trim().toLowerCase();
    }
    if (city) user.city = resolveCanonicalCity(city);
    if (district) user.district = district.trim();
    if (state) user.state = state.trim();
    if (pincode) user.pincode = pincode.trim();
    if (req.file) user.profile_image = `/uploads/${req.file.filename}`;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        city: resolveCanonicalCity(user.city),
        district: user.district,
        state: user.state,
        pincode: user.pincode,
        profile_image: user.profile_image,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};

module.exports = { register, login, logout, getMe, updateProfile };
