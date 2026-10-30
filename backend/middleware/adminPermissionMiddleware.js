'use strict';
const { AdminRolePermission, AdminAuditLog } = require('../models');

// In-memory rate limiting tracker for admin login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkAdminLoginRateLimit(ip, email) {
  const key = `${ip}_${(email || '').toLowerCase().trim()}`;
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) return { allowed: true };

  // If lockout window passed, reset
  if (now - record.firstAttempt > LOCKOUT_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingMs = LOCKOUT_MS - (now - record.firstAttempt);
    const remainingMin = Math.ceil(remainingMs / 60000);
    return {
      allowed: false,
      message: `Too many failed login attempts. Portal access locked for ${remainingMin} minute(s) to protect administrator accounts.`,
      remainingSeconds: Math.ceil(remainingMs / 1000)
    };
  }

  return { allowed: true };
}

function recordAdminLoginFailure(ip, email) {
  const key = `${ip}_${(email || '').toLowerCase().trim()}`;
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || (now - record.firstAttempt > LOCKOUT_MS)) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
    loginAttempts.set(key, record);
  }
}

function clearAdminLoginFailures(ip, email) {
  const key = `${ip}_${(email || '').toLowerCase().trim()}`;
  loginAttempts.delete(key);
}

/**
 * Middleware: Verify user is an authenticated Admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: System Administrator privileges required.'
    });
  }
  if (req.user.account_status === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Administrator account suspended. Contact Super Administrator.'
    });
  }
  next();
};

/**
 * Middleware: Verify user has specific administrative permission
 */
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
    }

    const adminRole = req.user.admin_role || 'Super Admin';

    // Super Admin has universal permission
    if (adminRole === 'Super Admin') {
      return next();
    }

    try {
      const allowed = await AdminRolePermission.findOne({
        where: {
          role_name: adminRole,
          permission_key: [permissionKey, '*']
        }
      });

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Role "${adminRole}" lacks required permission "${permissionKey}".`
        });
      }

      next();
    } catch (err) {
      console.error('requirePermission error:', err);
      return res.status(500).json({ success: false, message: 'Permission evaluation failed.' });
    }
  };
};

module.exports = {
  requireAdmin,
  requirePermission,
  checkAdminLoginRateLimit,
  recordAdminLoginFailure,
  clearAdminLoginFailures,
};
