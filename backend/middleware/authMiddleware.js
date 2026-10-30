'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.pending_mfa) return res.status(401).json({ success: false, message: 'Complete two-factor authentication first.' });

    const user = await User.findByPk(decoded.user_id, {
      attributes: ['user_id', 'name', 'email', 'role', 'admin_role', 'account_status', 'city', 'profile_image'],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
    }

    if (user.account_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please log in.' });
  }
};

// Optional auth – attaches user if token present, but doesn't block
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.user_id, {
        attributes: ['user_id', 'name', 'email', 'role', 'account_status', 'city'],
      });
      if (req.user && req.user.account_status === 'suspended') {
        req.user = null;
      }
    }
  } catch (_) {
    // Ignore invalid tokens for optional auth
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
