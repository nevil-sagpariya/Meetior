'use strict';

const { Op, fn, col, literal } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  User, Event, EventRegistration, Payment, Category, Location,
  City, District, State, EventTicket, EventCheckIn, EventReview,
  EventInteraction, Report, EventModeration, AdminAuditLog,
  PlatformSetting, AdminRolePermission, Notification, sequelize
} = require('../models');
const {
  checkAdminLoginRateLimit,
  recordAdminLoginFailure,
  clearAdminLoginFailures
} = require('../middleware/adminPermissionMiddleware');
const { generateSecret, verifyToken, getOtpAuthUrl } = require('../utils/mfa');
const notificationService = require('../services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET || 'meetior_super_secure_jwt_secret_2026';

// Helper: Get client IP address
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

// Helper: Parse date filter into Sequelize Op.between or Op.gte
function buildDateRangeFilter(timeFilter, customStart, customEnd, fieldName = 'created_at') {
  const now = new Date();
  if (timeFilter === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    return { [fieldName]: { [Op.gte]: start } };
  }
  if (timeFilter === '7d') {
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    return { [fieldName]: { [Op.gte]: start } };
  }
  if (timeFilter === '30d') {
    const start = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return { [fieldName]: { [Op.gte]: start } };
  }
  if (timeFilter === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    return { [fieldName]: { [Op.gte]: start } };
  }
  if (timeFilter === 'this_year') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    return { [fieldName]: { [Op.gte]: start } };
  }
  if (timeFilter === 'custom' && customStart) {
    const start = new Date(customStart);
    const end = customEnd ? new Date(customEnd + 'T23:59:59') : now;
    return { [fieldName]: { [Op.between]: [start, end] } };
  }
  return {};
}

// Helper: Get configurable platform commission percentage
async function getPlatformCommissionPercent() {
  try {
    const setting = await PlatformSetting.findOne({ where: { setting_key: 'platform_commission_percent' } });
    if (setting && setting.setting_value) {
      const val = parseFloat(setting.setting_value);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (_) {}
  return 5.0; // Default 5.0%
}

// ============================================================================
// 1. ADMIN AUTHENTICATION, MFA & SESSION MANAGEMENT
// ============================================================================

// POST /api/admin/auth/login
const adminLogin = async (req, res) => {
  const ip = getClientIp(req);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  // 1. Check Rate Limiter
  const rateLimitStatus = checkAdminLoginRateLimit(ip, email);
  if (!rateLimitStatus.allowed) {
    // Log rate limit trigger
    try {
      await AdminAuditLog.create({
        admin_id: 1, // System placeholder
        action: 'admin_login_rate_limited',
        target_type: 'security',
        target_id: 0,
        reason: `Rate limit exceeded for ${email} from ${ip}`,
        ip_address: ip
      });
    } catch (_) {}
    return res.status(429).json({ success: false, message: rateLimitStatus.message });
  }

  try {
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    // Validate existence & Admin role
    if (!user || user.role !== 'Admin') {
      recordAdminLoginFailure(ip, email);
      return res.status(403).json({
        success: false,
        message: 'Access denied: System Administrator privileges required.'
      });
    }

    // Validate account status
    if (user.account_status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Administrator account suspended. Contact Super Administrator.'
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      recordAdminLoginFailure(ip, email);
      await AdminAuditLog.create({
        admin_id: user.user_id,
        action: 'admin_login_failed',
        target_type: 'security',
        target_id: user.user_id,
        reason: `Failed admin login attempt (invalid credentials) from ${ip}`,
        ip_address: ip
      });
      return res.status(401).json({ success: false, message: 'Incorrect administrator credentials.' });
    }

    // Check if 2FA / MFA is enabled
    if (user.mfa_enabled && user.mfa_secret) {
      const tempToken = jwt.sign(
        { user_id: user.user_id, pending_mfa: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        mfa_required: true,
        temp_token: tempToken,
        message: 'Enter 6-digit authenticator code to proceed.'
      });
    }

    // Successful login without MFA
    clearAdminLoginFailures(ip, email);
    user.last_login_at = new Date();
    await user.save();

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, admin_role: user.admin_role || 'Super Admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await AdminAuditLog.create({
      admin_id: user.user_id,
      action: 'admin_login_success',
      target_type: 'security',
      target_id: user.user_id,
      reason: `Administrator logged in successfully (${user.admin_role})`,
      ip_address: ip
    });

    return res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        admin_role: user.admin_role,
        mfa_enabled: Boolean(user.mfa_enabled),
        last_login_at: user.last_login_at
      }
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    return res.status(500).json({ success: false, message: 'Admin authentication failed: ' + err.message });
  }
};

// POST /api/admin/auth/verify-mfa
const adminVerifyMfa = async (req, res) => {
  const ip = getClientIp(req);
  const { temp_token, mfa_code } = req.body;

  if (!temp_token || !mfa_code) {
    return res.status(400).json({ success: false, message: 'Temporary token and MFA code are required.' });
  }

  try {
    const decoded = jwt.verify(temp_token, JWT_SECRET);
    if (!decoded.pending_mfa || !decoded.user_id) {
      return res.status(401).json({ success: false, message: 'Invalid or expired MFA session.' });
    }

    const user = await User.findByPk(decoded.user_id);
    if (!user || user.role !== 'Admin' || user.account_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const isValid = verifyToken(user.mfa_secret, mfa_code);
    if (!isValid) {
      await AdminAuditLog.create({
        admin_id: user.user_id,
        action: 'admin_mfa_failed',
        target_type: 'security',
        target_id: user.user_id,
        reason: `Invalid 2FA code supplied from ${ip}`,
        ip_address: ip
      });
      return res.status(401).json({ success: false, message: 'Invalid 6-digit authentication code.' });
    }

    clearAdminLoginFailures(ip, user.email);
    user.last_login_at = new Date();
    await user.save();

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, admin_role: user.admin_role || 'Super Admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await AdminAuditLog.create({
      admin_id: user.user_id,
      action: 'admin_login_success',
      target_type: 'security',
      target_id: user.user_id,
      reason: `Administrator logged in with verified 2FA (${user.admin_role})`,
      ip_address: ip
    });

    return res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        admin_role: user.admin_role,
        mfa_enabled: true,
        last_login_at: user.last_login_at
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'MFA session expired or invalid.' });
  }
};

// POST /api/admin/auth/logout
const adminLogout = async (req, res) => {
  try {
    if (req.user) {
      await AdminAuditLog.create({
        admin_id: req.user.user_id,
        action: 'admin_logout',
        target_type: 'security',
        target_id: req.user.user_id,
        reason: 'Administrator logged out session',
        ip_address: getClientIp(req)
      });
    }
    return res.json({ success: true, message: 'Administrator logged out successfully.' });
  } catch (err) {
    return res.json({ success: true });
  }
};

// GET /api/admin/auth/me
const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ['user_id', 'name', 'email', 'role', 'admin_role', 'account_status', 'mfa_enabled', 'last_login_at', 'created_at']
    });

    const permissions = await AdminRolePermission.findAll({
      where: { role_name: user.admin_role },
      attributes: ['permission_key', 'description']
    });

    return res.json({
      success: true,
      user,
      permissions: permissions.map(p => p.permission_key)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load admin profile.' });
  }
};

// POST /api/admin/auth/mfa/setup
const setupAdminMfa = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    const secret = generateSecret();
    const otpauthUrl = getOtpAuthUrl(secret, user.email);

    return res.json({
      success: true,
      secret,
      otpauth_url: otpauthUrl,
      instructions: 'Add this secret key into Google Authenticator or scan the setup URI.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'MFA setup error: ' + err.message });
  }
};

// POST /api/admin/auth/mfa/confirm
const confirmAdminMfa = async (req, res) => {
  const { secret, token } = req.body;
  if (!secret || !token) {
    return res.status(400).json({ success: false, message: 'Secret and confirmation code are required.' });
  }

  const isValid = verifyToken(secret, token);
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid confirmation code. Please check your authenticator clock.' });
  }

  try {
    const user = await User.findByPk(req.user.user_id);
    user.mfa_secret = secret;
    user.mfa_enabled = true;
    await user.save();

    await AdminAuditLog.create({
      admin_id: user.user_id,
      action: 'admin_mfa_enabled',
      target_type: 'security',
      target_id: user.user_id,
      reason: 'Two-Factor Authentication activated for administrator account',
      ip_address: getClientIp(req)
    });

    return res.json({ success: true, message: 'Two-Factor Authentication is now ENABLED! 🔐' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not save MFA: ' + err.message });
  }
};

// POST /api/admin/auth/mfa/disable
const disableAdminMfa = async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Admin password required to disable 2FA.' });
  }

  try {
    const user = await User.findByPk(req.user.user_id);
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect administrator password.' });
    }

    user.mfa_enabled = false;
    user.mfa_secret = null;
    await user.save();

    await AdminAuditLog.create({
      admin_id: user.user_id,
      action: 'admin_mfa_disabled',
      target_type: 'security',
      target_id: user.user_id,
      reason: 'Two-Factor Authentication disabled by administrator',
      ip_address: getClientIp(req)
    });

    return res.json({ success: true, message: 'Two-Factor Authentication has been disabled.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not disable MFA: ' + err.message });
  }
};

// ============================================================================
// 2. MAIN ADMIN DASHBOARD & 15 REAL DATABASE METRICS
// ============================================================================

// GET /api/admin/overview
const getAdminOverview = async (req, res) => {
  try {
    const { timeFilter = 'all', startDate, endDate } = req.query;

    const eventDateFilter = buildDateRangeFilter(timeFilter, startDate, endDate, 'created_at');
    const regDateFilter = buildDateRangeFilter(timeFilter, startDate, endDate, 'registered_at');
    const paymentDateFilter = buildDateRangeFilter(timeFilter, startDate, endDate, 'created_at');
    const checkinDateFilter = buildDateRangeFilter(timeFilter, startDate, endDate, 'checked_in_at');
    const userDateFilter = buildDateRangeFilter(timeFilter, startDate, endDate, 'created_at');

    // Commission %
    const commissionPercent = await getPlatformCommissionPercent();

    // 1 & 2. Total registered attendees & organizers
    const totalAttendees = await User.count({ where: { role: 'Attendee' } });
    const totalOrganizers = await User.count({ where: { role: 'Organizer' } });
    const totalAdmins = await User.count({ where: { role: 'Admin' } });

    // 3 & 4. Active attendees & organizers
    const activeAttendees = await User.count({ where: { role: 'Attendee', account_status: 'active' } });
    const activeOrganizers = await User.count({ where: { role: 'Organizer', account_status: 'active' } });

    // 5, 6, 7, 8. Events metrics in time period
    const totalEvents = await Event.count({ where: eventDateFilter });
    const publishedEvents = await Event.count({
      where: { ...eventDateFilter, status: 'Published', moderation_status: 'Approved' }
    });
    const pendingApprovalEvents = await Event.count({
      where: {
        ...eventDateFilter,
        [Op.or]: [
          { moderation_status: 'UnderReview' },
          { status: 'Draft' }
        ]
      }
    });
    const cancelledEvents = await Event.count({
      where: { ...eventDateFilter, status: 'Cancelled' }
    });
    const completedEvents = await Event.count({
      where: { ...eventDateFilter, status: 'Completed' }
    });

    // 9. Total confirmed bookings in time period
    const totalConfirmedBookings = await EventRegistration.count({
      where: { ...regDateFilter, registration_status: 'Confirmed' }
    });
    const totalCancelledBookings = await EventRegistration.count({
      where: { ...regDateFilter, registration_status: 'Cancelled' }
    });

    // 10. Total interested / engaged users
    const totalInterestedUsers = await EventInteraction.count({
      where: {
        interaction_type: { [Op.in]: ['interested', 'going', 'saved'] }
      }
    });

    // 11. Total verified attendance / QR check-ins
    const totalVerifiedCheckins = await EventCheckIn.count({ where: checkinDateFilter });

    // 12. Total gross booking value (completed payments)
    const grossRevenueSum = await Payment.sum('amount', {
      where: { ...paymentDateFilter, status: 'Completed' }
    });
    const totalBookingValue = parseFloat(grossRevenueSum || 0);

    // 15. Total refunds
    const refundsSum = await Payment.sum('amount', {
      where: { ...paymentDateFilter, status: 'Refunded' }
    });
    const totalRefunds = parseFloat(refundsSum || 0);

    // 14. Total platform revenue (commission on completed payments)
    const totalPlatformRevenue = parseFloat((totalBookingValue * (commissionPercent / 100)).toFixed(2));

    // 13. Total organizer earnings = Gross - Refunds - Commission
    const netOrganizerEarnings = Math.max(0, parseFloat((totalBookingValue - totalRefunds - totalPlatformRevenue).toFixed(2)));

    // Other operational health indicators
    const pendingReports = await Report.count({ where: { status: 'pending' } });
    const totalReviews = await EventReview.count();
    const avgRatingRes = await EventReview.findOne({
      attributes: [[fn('AVG', col('rating')), 'avg_rating']],
      raw: true
    });
    const platformAvgRating = parseFloat(avgRatingRes?.avg_rating || 0).toFixed(1);

    // Monthly revenue trend (last 6 months) for visualization
    const monthlyTrend = await Payment.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('COUNT', col('payment_id')), 'count']
      ],
      where: { status: 'Completed' },
      group: [literal("DATE_FORMAT(created_at, '%Y-%m')")],
      order: [[literal("DATE_FORMAT(created_at, '%Y-%m')"), 'ASC']],
      limit: 6,
      raw: true
    });

    return res.json({
      success: true,
      time_filter: timeFilter,
      commission_percent: commissionPercent,
      is_sandbox_mode: true,
      stats: {
        // 15 required core dashboard statistics:
        1: { id: 'total_attendees', label: 'Total Registered Attendees', value: totalAttendees },
        2: { id: 'total_organizers', label: 'Total Registered Organizers', value: totalOrganizers },
        3: { id: 'active_attendees', label: 'Active Attendees', value: activeAttendees },
        4: { id: 'active_organizers', label: 'Active Organizers', value: activeOrganizers },
        5: { id: 'total_events', label: 'Total Events', value: totalEvents },
        6: { id: 'published_events', label: 'Published Events', value: publishedEvents },
        7: { id: 'pending_approval_events', label: 'Pending Approval Events', value: pendingApprovalEvents },
        8: { id: 'cancelled_events', label: 'Cancelled Events', value: cancelledEvents },
        9: { id: 'total_confirmed_bookings', label: 'Confirmed Bookings', value: totalConfirmedBookings },
        10: { id: 'total_interested_users', label: 'Total Interested Users', value: totalInterestedUsers },
        11: { id: 'total_verified_checkins', label: 'Verified QR Check-Ins', value: totalVerifiedCheckins },
        12: { id: 'total_booking_value', label: 'Gross Booking Value', value: totalBookingValue, formatted: `₹${totalBookingValue.toFixed(2)}` },
        13: { id: 'total_organizer_earnings', label: 'Estimated Organizer Earnings', value: netOrganizerEarnings, formatted: `₹${netOrganizerEarnings.toFixed(2)}` },
        14: { id: 'total_platform_revenue', label: 'Platform Revenue (Commission)', value: totalPlatformRevenue, formatted: `₹${totalPlatformRevenue.toFixed(2)}` },
        15: { id: 'total_refunds', label: 'Total Refunds', value: totalRefunds, formatted: `₹${totalRefunds.toFixed(2)}` },

        // Grouped for backward compatibility & frontend charts:
        users: {
          total: totalAttendees + totalOrganizers + totalAdmins,
          attendees: totalAttendees,
          organizers: totalOrganizers,
          admins: totalAdmins,
          active_attendees: activeAttendees,
          active_organizers: activeOrganizers,
        },
        events: {
          total: totalEvents,
          approved: publishedEvents,
          pending: pendingApprovalEvents,
          completed: completedEvents,
          cancelled: cancelledEvents,
        },
        registrations: {
          total: totalConfirmedBookings + totalCancelledBookings,
          confirmed: totalConfirmedBookings,
          cancelled: totalCancelledBookings,
          checkins: totalVerifiedCheckins,
        },
        finance: {
          gross_booking_value: totalBookingValue,
          total_refunds: totalRefunds,
          platform_commission_percent: commissionPercent,
          platform_revenue: totalPlatformRevenue,
          organizer_earnings: netOrganizerEarnings,
          gateway_mode: 'TEST / SIMULATED (Razorpay Sandbox)',
          actual_payout_status: 'Actual payouts not configured (Manual / Direct settlement)'
        },
        governance: {
          pending_reports: pendingReports,
          total_reviews: totalReviews,
          average_rating: platformAvgRating,
        },
        monthly_trend: monthlyTrend || []
      }
    });
  } catch (err) {
    console.error('getAdminOverview error:', err);
    return res.status(500).json({ success: false, message: 'Could not load admin stats: ' + err.message });
  }
};

// ============================================================================
// 3. ATTENDEE MANAGEMENT
// ============================================================================

// GET /api/admin/attendees and /api/admin/users
const getAttendees = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (role && role !== 'all') {
      where.role = role;
    } else if (req.path && req.path.includes('attendees')) {
      where.role = 'Attendee';
    }

    if (status && status !== 'all') {
      where.account_status = status;
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { city: { [Op.like]: q } },
        { user_id: isNaN(search.trim()) ? -1 : parseInt(search.trim()) }
      ];
    }

    const { count, rows: attendees } = await User.findAndCountAll({
      where,
      attributes: ['user_id', 'name', 'email', 'phone_number', 'role', 'city', 'district', 'state', 'account_status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Augment with booking, checkin, review metrics
    const augmentedAttendees = await Promise.all(attendees.map(async (att) => {
      const u = att.toJSON();
      
      const confirmedBookings = await EventRegistration.count({
        where: { user_id: u.user_id, registration_status: 'Confirmed' }
      });
      const cancelledBookings = await EventRegistration.count({
        where: { user_id: u.user_id, registration_status: 'Cancelled' }
      });

      // Count verified check-ins (attended)
      const registrations = await EventRegistration.findAll({
        where: { user_id: u.user_id },
        attributes: ['registration_id']
      });
      const regIds = registrations.map(r => r.registration_id);
      let verifiedAttended = 0;
      if (regIds.length > 0) {
        const tickets = await EventTicket.findAll({
          where: { registration_id: { [Op.in]: regIds } },
          attributes: ['ticket_id']
        });
        const ticketIds = tickets.map(t => t.ticket_id);
        if (ticketIds.length > 0) {
          verifiedAttended = await EventCheckIn.count({
            where: { ticket_id: { [Op.in]: ticketIds } }
          });
        }
      }

      const reviewsSubmitted = await EventReview.count({ where: { user_id: u.user_id } });

      // Mask phone number for default privacy (e.g. +91 98*** **321)
      let maskedPhone = 'Not provided';
      if (u.phone_number) {
        const p = u.phone_number.trim();
        maskedPhone = p.length >= 7 
          ? `+91 ${p.slice(0, 2)}*** ***${p.slice(-2)}`
          : `+91 ${p}`;
      }

      return {
        ...u,
        masked_phone: maskedPhone,
        total_confirmed_bookings: confirmedBookings,
        total_cancelled_bookings: cancelledBookings,
        total_verified_attended: verifiedAttended,
        total_reviews_submitted: reviewsSubmitted
      };
    }));

    return res.json({
      success: true,
      total: count,
      count: augmentedAttendees.length,
      page: parseInt(page),
      limit: parseInt(limit),
      attendees: augmentedAttendees,
      users: augmentedAttendees
    });
  } catch (err) {
    console.error('getAttendees error:', err);
    return res.status(500).json({ success: false, message: 'Could not list attendees: ' + err.message });
  }
};

// GET /api/admin/attendees/:id
const getAttendeeDetails = async (req, res) => {
  try {
    const attendeeId = parseInt(req.params.id);
    const user = await User.findOne({
      where: { user_id: attendeeId, role: 'Attendee' },
      attributes: ['user_id', 'name', 'email', 'phone_number', 'city', 'district', 'state', 'pincode', 'account_status', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Attendee not found.' });
    }

    // Complete Booking History with Tickets and Payments
    const bookings = await EventRegistration.findAll({
      where: { user_id: attendeeId },
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['event_id', 'title', 'start_datetime', 'end_datetime', 'price', 'currency', 'status'],
          include: [{ model: Location, as: 'location', attributes: ['venue_name', 'city'] }]
        },
        { model: EventTicket, as: 'ticket', attributes: ['ticket_id', 'public_ticket_number', 'ticket_status', 'issued_at'] },
        { model: Payment, as: 'payment', attributes: ['payment_id', 'amount', 'currency', 'status', 'paid_at'] }
      ],
      order: [['registered_at', 'DESC']]
    });

    // Check-in history
    const ticketIds = bookings.map(b => b.ticket?.ticket_id).filter(Boolean);
    const checkIns = ticketIds.length > 0 ? await EventCheckIn.findAll({
      where: { ticket_id: { [Op.in]: ticketIds } },
      include: [
        { model: Event, as: 'event', attributes: ['title'] },
        { model: User, as: 'scanner', attributes: ['name', 'email'] }
      ],
      order: [['checked_in_at', 'DESC']]
    }) : [];

    // Reviews submitted
    const reviews = await EventReview.findAll({
      where: { user_id: attendeeId },
      include: [{ model: Event, as: 'event', attributes: ['event_id', 'title'] }],
      order: [['created_at', 'DESC']]
    });

    // Reports filed by or against attendee
    const reportsFiled = await Report.findAll({
      where: { reporter_id: attendeeId },
      order: [['created_at', 'DESC']]
    });
    const reportsAgainst = await Report.findAll({
      where: { target_type: 'user', target_id: attendeeId },
      include: [{ model: User, as: 'reporter', attributes: ['name', 'email'] }],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      attendee: user,
      bookings,
      check_ins: checkIns,
      reviews,
      reports: {
        filed: reportsFiled,
        received: reportsAgainst
      }
    });
  } catch (err) {
    console.error('getAttendeeDetails error:', err);
    return res.status(500).json({ success: false, message: 'Could not load attendee details: ' + err.message });
  }
};

// ============================================================================
// 4. ORGANIZER MANAGEMENT & PERFORMANCE
// ============================================================================

// GET /api/admin/organizers
const getOrganizers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { role: 'Organizer' };

    if (status && status !== 'all') {
      where.account_status = status;
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { city: { [Op.like]: q } },
        { user_id: isNaN(search.trim()) ? -1 : parseInt(search.trim()) }
      ];
    }

    const commissionPercent = await getPlatformCommissionPercent();

    const { count, rows: organizers } = await User.findAndCountAll({
      where,
      attributes: ['user_id', 'name', 'email', 'phone_number', 'city', 'district', 'state', 'account_status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const augmentedOrganizers = await Promise.all(organizers.map(async (org) => {
      const o = org.toJSON();

      const eventsCreated = await Event.count({ where: { organizer_id: o.user_id } });
      const publishedEvents = await Event.count({ where: { organizer_id: o.user_id, status: 'Published' } });
      const cancelledEvents = await Event.count({ where: { organizer_id: o.user_id, status: 'Cancelled' } });

      const myEvents = await Event.findAll({
        where: { organizer_id: o.user_id },
        attributes: ['event_id']
      });
      const eventIds = myEvents.map(e => e.event_id);

      let confirmedBookings = 0;
      let verifiedAttendance = 0;
      let grossRevenue = 0;
      let totalRefunds = 0;
      let avgRating = 0;

      if (eventIds.length > 0) {
        confirmedBookings = await EventRegistration.count({
          where: { event_id: { [Op.in]: eventIds }, registration_status: 'Confirmed' }
        });

        verifiedAttendance = await EventCheckIn.count({
          where: { event_id: { [Op.in]: eventIds } }
        });

        const orgRegs = await EventRegistration.findAll({
          where: { event_id: { [Op.in]: eventIds } },
          attributes: ['registration_id']
        });
        const regIds = orgRegs.map(r => r.registration_id);

        if (regIds.length > 0) {
          const completedSum = await Payment.sum('amount', {
            where: { registration_id: { [Op.in]: regIds }, status: 'Completed' }
          });
          grossRevenue = parseFloat(completedSum || 0);

          const refundedSum = await Payment.sum('amount', {
            where: { registration_id: { [Op.in]: regIds }, status: 'Refunded' }
          });
          totalRefunds = parseFloat(refundedSum || 0);
        }

        const ratingRes = await EventReview.findOne({
          where: { event_id: { [Op.in]: eventIds } },
          attributes: [[fn('AVG', col('rating')), 'avg']],
          raw: true
        });
        avgRating = parseFloat(ratingRes?.avg || 0).toFixed(1);
      }

      const commission = parseFloat((grossRevenue * (commissionPercent / 100)).toFixed(2));
      const netEarnings = Math.max(0, parseFloat((grossRevenue - totalRefunds - commission).toFixed(2)));

      return {
        ...o,
        total_events_created: eventsCreated,
        published_events: publishedEvents,
        cancelled_events: cancelledEvents,
        total_confirmed_bookings: confirmedBookings,
        total_verified_attendance: verifiedAttendance,
        average_rating: parseFloat(avgRating),
        gross_revenue: grossRevenue,
        total_refunds: totalRefunds,
        net_estimated_earnings: netEarnings,
        payout_status: 'TEST / SIMULATED (Sandbox Mode)'
      };
    }));

    return res.json({
      success: true,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      organizers: augmentedOrganizers
    });
  } catch (err) {
    console.error('getOrganizers error:', err);
    return res.status(500).json({ success: false, message: 'Could not list organizers: ' + err.message });
  }
};

// GET /api/admin/organizers/:id
const getOrganizerDetails = async (req, res) => {
  try {
    const orgId = parseInt(req.params.id);
    const organizer = await User.findOne({
      where: { user_id: orgId, role: 'Organizer' },
      attributes: ['user_id', 'name', 'email', 'phone_number', 'city', 'district', 'state', 'pincode', 'account_status', 'created_at']
    });

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found.' });
    }

    const commissionPercent = await getPlatformCommissionPercent();

    // All events created by organizer
    const events = await Event.findAll({
      where: { organizer_id: orgId },
      include: [
        { model: Category, as: 'category', attributes: ['name', 'icon'] },
        { model: Location, as: 'location', attributes: ['venue_name', 'city'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Detailed metrics per event
    const eventsPerformance = await Promise.all(events.map(async (ev) => {
      const e = ev.toJSON();
      const confirmed = await EventRegistration.count({
        where: { event_id: e.event_id, registration_status: 'Confirmed' }
      });
      const checkins = await EventCheckIn.count({ where: { event_id: e.event_id } });

      const regs = await EventRegistration.findAll({
        where: { event_id: e.event_id },
        attributes: ['registration_id']
      });
      const regIds = regs.map(r => r.registration_id);

      let eventGross = 0;
      let eventRefunds = 0;
      if (regIds.length > 0) {
        const sum = await Payment.sum('amount', {
          where: { registration_id: { [Op.in]: regIds }, status: 'Completed' }
        });
        eventGross = parseFloat(sum || 0);

        const refSum = await Payment.sum('amount', {
          where: { registration_id: { [Op.in]: regIds }, status: 'Refunded' }
        });
        eventRefunds = parseFloat(refSum || 0);
      }

      const ratingRes = await EventReview.findOne({
        where: { event_id: e.event_id },
        attributes: [
          [fn('AVG', col('rating')), 'avg'],
          [fn('COUNT', col('review_id')), 'cnt']
        ],
        raw: true
      });

      return {
        ...e,
        confirmed_bookings: confirmed,
        verified_checkins: checkins,
        gross_revenue: eventGross,
        refunds: eventRefunds,
        net_revenue: Math.max(0, eventGross - eventRefunds),
        average_rating: parseFloat(ratingRes?.avg || 0).toFixed(1),
        review_count: parseInt(ratingRes?.cnt || 0)
      };
    }));

    // Reviews received across all events
    const eventIds = events.map(e => e.event_id);
    const reviews = eventIds.length > 0 ? await EventReview.findAll({
      where: { event_id: { [Op.in]: eventIds } },
      include: [
        { model: User, as: 'reviewer', attributes: ['name', 'email'] },
        { model: Event, as: 'event', attributes: ['title'] }
      ],
      order: [['created_at', 'DESC']]
    }) : [];

    // Rating distribution
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (ratingBreakdown[r.rating] !== undefined) ratingBreakdown[r.rating]++;
    });

    // Financial totals
    const totalGross = eventsPerformance.reduce((acc, curr) => acc + curr.gross_revenue, 0);
    const totalRefunds = eventsPerformance.reduce((acc, curr) => acc + curr.refunds, 0);
    const totalCommission = parseFloat((totalGross * (commissionPercent / 100)).toFixed(2));
    const netEstimatedEarnings = Math.max(0, parseFloat((totalGross - totalRefunds - totalCommission).toFixed(2)));

    // Complaints filed against organizer
    const complaints = await Report.findAll({
      where: {
        [Op.or]: [
          { target_type: 'organizer', target_id: orgId },
          { target_type: 'event', target_id: { [Op.in]: eventIds.length > 0 ? eventIds : [-1] } }
        ]
      },
      include: [{ model: User, as: 'reporter', attributes: ['name', 'email'] }],
      order: [['created_at', 'DESC']]
    });

    // Moderation history on organizer's events
    const moderationLogs = eventIds.length > 0 ? await EventModeration.findAll({
      where: { event_id: { [Op.in]: eventIds } },
      include: [
        { model: User, as: 'admin', attributes: ['name', 'email'] },
        { model: Event, as: 'event', attributes: ['title'] }
      ],
      order: [['created_at', 'DESC']]
    }) : [];

    return res.json({
      success: true,
      organizer,
      financial_summary: {
        gross_revenue: totalGross,
        total_refunds: totalRefunds,
        commission_percent: commissionPercent,
        platform_commission_amount: totalCommission,
        net_estimated_earnings: netEstimatedEarnings,
        payout_status: 'TEST / SIMULATED (Razorpay Sandbox Mode)',
        settlement_notice: 'Actual payouts not configured'
      },
      events: eventsPerformance,
      reviews_summary: {
        total_reviews: reviews.length,
        average_rating: reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : 0,
        distribution: ratingBreakdown,
        reviews_list: reviews
      },
      complaints,
      moderation_history: moderationLogs
    });
  } catch (err) {
    console.error('getOrganizerDetails error:', err);
    return res.status(500).json({ success: false, message: 'Could not load organizer details: ' + err.message });
  }
};

// ============================================================================
// 5. ORGANIZER EARNINGS & REVENUE TRACKING
// ============================================================================

// GET /api/admin/finance/organizer-earnings
const getOrganizerEarningsReport = async (req, res) => {
  try {
    const { timeFilter = 'all', startDate, endDate, search } = req.query;
    const paymentDateFilter = buildDateRangeFilter(timeFilter, startDate, endDate, 'created_at');
    const commissionPercent = await getPlatformCommissionPercent();

    const orgWhere = { role: 'Organizer' };
    if (search && search.trim()) {
      orgWhere[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const organizers = await User.findAll({
      where: orgWhere,
      attributes: ['user_id', 'name', 'email', 'city', 'state'],
      order: [['name', 'ASC']]
    });

    const report = await Promise.all(organizers.map(async (org) => {
      const myEvents = await Event.findAll({
        where: { organizer_id: org.user_id },
        attributes: ['event_id']
      });
      const eventIds = myEvents.map(e => e.event_id);

      if (eventIds.length === 0) {
        return {
          organizer_id: org.user_id,
          name: org.name,
          email: org.email,
          city: org.city || 'Ahmedabad',
          total_paid_bookings: 0,
          gross_booking_revenue: 0,
          total_refunds: 0,
          platform_commission_amount: 0,
          net_estimated_earnings: 0,
          mode: 'TEST/SIMULATED',
          payout_status: 'Actual payouts not configured'
        };
      }

      const registrations = await EventRegistration.findAll({
        where: { event_id: { [Op.in]: eventIds } },
        attributes: ['registration_id']
      });
      const regIds = registrations.map(r => r.registration_id);

      if (regIds.length === 0) {
        return {
          organizer_id: org.user_id,
          name: org.name,
          email: org.email,
          city: org.city || 'Ahmedabad',
          total_paid_bookings: 0,
          gross_booking_revenue: 0,
          total_refunds: 0,
          platform_commission_amount: 0,
          net_estimated_earnings: 0,
          mode: 'TEST/SIMULATED',
          payout_status: 'Actual payouts not configured'
        };
      }

      const completedPayments = await Payment.findAll({
        where: {
          ...paymentDateFilter,
          registration_id: { [Op.in]: regIds },
          status: 'Completed'
        },
        attributes: ['amount']
      });
      const paidBookingsCount = completedPayments.length;
      const grossRevenue = completedPayments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);

      const refundedPayments = await Payment.findAll({
        where: {
          ...paymentDateFilter,
          registration_id: { [Op.in]: regIds },
          status: 'Refunded'
        },
        attributes: ['amount']
      });
      const totalRefunds = refundedPayments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);

      const commission = parseFloat((grossRevenue * (commissionPercent / 100)).toFixed(2));
      const netEarnings = Math.max(0, parseFloat((grossRevenue - totalRefunds - commission).toFixed(2)));

      return {
        organizer_id: org.user_id,
        name: org.name,
        email: org.email,
        city: org.city || 'Ahmedabad',
        total_paid_bookings: paidBookingsCount,
        gross_booking_revenue: grossRevenue,
        total_refunds: totalRefunds,
        platform_commission_percent: commissionPercent,
        platform_commission_amount: commission,
        net_estimated_earnings: netEarnings,
        mode: 'TEST/SIMULATED',
        payout_status: 'Actual payouts not configured'
      };
    }));

    // Aggregate totals
    const totalGross = report.reduce((acc, r) => acc + r.gross_booking_revenue, 0);
    const totalRefunds = report.reduce((acc, r) => acc + r.total_refunds, 0);
    const totalCommission = report.reduce((acc, r) => acc + r.platform_commission_amount, 0);
    const totalNetEarnings = report.reduce((acc, r) => acc + r.net_estimated_earnings, 0);

    return res.json({
      success: true,
      time_filter: timeFilter,
      commission_percent: commissionPercent,
      notice: 'IMPORTANT: Razorpay Test Mode transactions are simulated and labeled TEST/SIMULATED. Actual bank payouts are not configured.',
      totals: {
        total_gross_booking_revenue: totalGross,
        total_refunds: totalRefunds,
        total_platform_commission: totalCommission,
        total_net_organizer_earnings: totalNetEarnings
      },
      organizers: report
    });
  } catch (err) {
    console.error('getOrganizerEarningsReport error:', err);
    return res.status(500).json({ success: false, message: 'Could not generate earnings report: ' + err.message });
  }
};

// ============================================================================
// 6. EVENT MANAGEMENT & MODERATION
// ============================================================================

// GET /api/admin/events
const getAdminEvents = async (req, res) => {
  try {
    const { search, status, moderation_status, category_id, city, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }
    if (moderation_status && moderation_status !== 'all') {
      where.moderation_status = moderation_status;
    }
    if (category_id && category_id !== 'all') {
      where.category_id = parseInt(category_id);
    }
    if (search && search.trim()) {
      where.title = { [Op.like]: `%${search.trim()}%` };
    }

    const locationInclude = {
      model: Location,
      as: 'location',
      attributes: ['venue_name', 'city', 'district', 'state']
    };
    if (city && city !== 'all') {
      locationInclude.where = { city };
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where,
      include: [
        { model: User, as: 'organizer', attributes: ['user_id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['category_id', 'name', 'icon'] },
        locationInclude,
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Compute bookings, attendance and revenue per event
    const augmentedEvents = await Promise.all(events.map(async (ev) => {
      const e = ev.toJSON();

      const confirmed = await EventRegistration.count({
        where: { event_id: e.event_id, registration_status: 'Confirmed' }
      });
      const checkins = await EventCheckIn.count({ where: { event_id: e.event_id } });

      const regs = await EventRegistration.findAll({
        where: { event_id: e.event_id },
        attributes: ['registration_id']
      });
      const regIds = regs.map(r => r.registration_id);

      let revenue = 0;
      if (regIds.length > 0) {
        const sum = await Payment.sum('amount', {
          where: { registration_id: { [Op.in]: regIds }, status: 'Completed' }
        });
        revenue = parseFloat(sum || 0);
      }

      return {
        ...e,
        organizer_name: e.organizer?.name || '',
        city: e.location?.city || '',
        confirmed_bookings: confirmed,
        verified_checkins: checkins,
        revenue: revenue,
        ticket_type: parseFloat(e.price) === 0 ? 'Free' : `Paid (₹${parseFloat(e.price).toFixed(2)})`
      };
    }));

    return res.json({
      success: true,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      events: augmentedEvents
    });
  } catch (err) {
    console.error('getAdminEvents error:', err);
    return res.status(500).json({ success: false, message: 'Could not load events: ' + err.message });
  }
};

// GET /api/admin/events/:id
const getEventDetails = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.findByPk(eventId, {
      include: [
        { model: User, as: 'organizer', attributes: ['user_id', 'name', 'email', 'phone_number'] },
        { model: Category, as: 'category', attributes: ['category_id', 'name', 'icon'] },
        { model: Location, as: 'location' },
        { model: EventModeration, as: 'moderation_actions', include: [{ model: User, as: 'admin', attributes: ['name', 'email'] }] }
      ]
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const registrations = await EventRegistration.findAll({
      where: { event_id: eventId },
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'email'] },
        { model: EventTicket, as: 'ticket', attributes: ['ticket_id', 'public_ticket_number', 'ticket_status'] },
        { model: Payment, as: 'payment', attributes: ['amount', 'status'] }
      ],
      order: [['registered_at', 'DESC']]
    });

    const checkIns = await EventCheckIn.findAll({
      where: { event_id: eventId },
      include: [
        { model: EventTicket, as: 'ticket', attributes: ['public_ticket_number'] },
        { model: User, as: 'scanner', attributes: ['name'] }
      ]
    });

    return res.json({
      success: true,
      event,
      registrations,
      check_ins: checkIns
    });
  } catch (err) {
    console.error('getEventDetails error:', err);
    return res.status(500).json({ success: false, message: 'Could not load event details.' });
  }
};

// PATCH /api/admin/events/:id/moderate
const moderateEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    let { action, moderation_status, reason, notify_organizer = true } = req.body;

    let targetStatus = moderation_status;
    if (!targetStatus && action) {
      const a = action.toLowerCase();
      if (a === 'hide') targetStatus = 'Hidden';
      if (a === 'restore' || a === 'approve') targetStatus = 'Approved';
      if (a === 'underreview' || a === 'flag') targetStatus = 'UnderReview';
    }

    if (!['Approved', 'Hidden', 'UnderReview'].includes(targetStatus)) {
      return res.status(400).json({ success: false, message: 'Target status must be Approved, Hidden, or UnderReview.' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const oldStatus = event.moderation_status;
    event.moderation_status = targetStatus;
    if (targetStatus === 'Approved' && event.status === 'Draft') {
      event.status = 'Published';
    }
    await event.save();

    const loggedAction = (targetStatus === 'Hidden') ? 'hide' : (targetStatus === 'Approved' ? 'restore' : 'flag');

    // Record moderation record
    await EventModeration.create({
      event_id: eventId,
      admin_id: req.user.user_id,
      action: loggedAction,
      reason: reason || `Admin moderation: ${targetStatus}`
    });

    // Record audit trail
    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: `event_${targetStatus.toLowerCase()}`,
      target_type: 'event',
      target_id: eventId,
      reason: reason || `Changed event "${event.title}" moderation status from ${oldStatus} to ${targetStatus}`,
      metadata_json: { event_title: event.title, organizer_id: event.organizer_id, old_status: oldStatus, new_status: targetStatus },
      ip_address: getClientIp(req)
    });

    // Notify organizer if enabled
    if (notify_organizer && event.organizer_id) {
      const notifTitle = targetStatus === 'Approved' ? 'Event Approved! 🎉' : `Event Moderation Notice: ${targetStatus}`;
      const notifMsg = targetStatus === 'Approved'
        ? `Your event "${event.title}" is approved and active in public discovery.`
        : `Your event "${event.title}" status changed to ${targetStatus}. Reason: ${reason || 'Administrative review'}.`;
      await notificationService.notify(event.organizer_id, 'event_moderation', notifTitle, notifMsg, event.event_id);
    }

    return res.json({
      success: true,
      message: `Event "${event.title}" is now ${targetStatus}.`,
      event
    });
  } catch (err) {
    console.error('moderateEvent error:', err);
    return res.status(500).json({ success: false, message: 'Moderation failed: ' + err.message });
  }
};

// ============================================================================
// 7. ACTUAL ATTENDANCE TRACKING
// ============================================================================

// GET /api/admin/attendance
const getAttendanceReport = async (req, res) => {
  try {
    const { timeFilter = 'all', startDate, endDate, city, search } = req.query;
    const eventDateFilter = buildDateRangeFilter(timeFilter, startDate, endDate, 'start_datetime');
    const where = { ...eventDateFilter };

    if (search && search.trim()) {
      where.title = { [Op.like]: `%${search.trim()}%` };
    }

    const locationInclude = {
      model: Location,
      as: 'location',
      attributes: ['venue_name', 'city']
    };
    if (city && city !== 'all') {
      locationInclude.where = { city };
    }

    const events = await Event.findAll({
      where,
      include: [
        { model: User, as: 'organizer', attributes: ['name', 'email'] },
        locationInclude,
      ],
      order: [['start_datetime', 'DESC']],
      limit: 100
    });

    let overallConfirmed = 0;
    let overallCheckedIn = 0;
    let overallNoShows = 0;

    const report = await Promise.all(events.map(async (ev) => {
      const e = ev.toJSON();
      const now = new Date();
      const eventStart = e.start_datetime ? new Date(e.start_datetime) : null;
      const isPastOrOngoing = e.status === 'Completed' || (e.end_datetime && now >= new Date(e.end_datetime));

      const interestedCount = await EventInteraction.count({
        where: { event_id: e.event_id, interaction_type: { [Op.in]: ['interested', 'going', 'saved'] } }
      });

      const confirmedBookings = await EventRegistration.count({
        where: { event_id: e.event_id, registration_status: 'Confirmed' }
      });

      const validCheckins = await EventCheckIn.count({
        where: { event_id: e.event_id }
      });

      // No-show calculation (only after event start / completed)
      let noShowCount = 0;
      if (isPastOrOngoing) {
        noShowCount = Math.max(0, confirmedBookings - validCheckins);
      }

      // Attendance Rate % = (Checked-in / Confirmed) * 100
      let attendanceRate = 0;
      if (confirmedBookings > 0) {
        attendanceRate = parseFloat(((validCheckins / confirmedBookings) * 100).toFixed(1));
      }

      overallConfirmed += confirmedBookings;
      overallCheckedIn += validCheckins;
      if (isPastOrOngoing) overallNoShows += noShowCount;

      return {
        event_id: e.event_id,
        title: e.title,
        organizer_name: e.organizer?.name || 'Organizer',
        city: e.location?.city || 'Ahmedabad',
        date: e.start_datetime,
        status: e.status,
        capacity: e.capacity,
        interested_users: interestedCount,
        confirmed_bookings: confirmedBookings,
        valid_checkins: validCheckins,
        no_shows: noShowCount,
        attendance_rate_percent: attendanceRate,
        is_completed: isPastOrOngoing
      };
    }));

    const platformAttendanceRate = overallConfirmed > 0
      ? parseFloat(((overallCheckedIn / overallConfirmed) * 100).toFixed(1))
      : 0;

    return res.json({
      success: true,
      summary: {
        total_eligible_confirmed: overallConfirmed,
        total_verified_checkins: overallCheckedIn,
        total_no_shows: overallNoShows,
        platform_attendance_rate: platformAttendanceRate
      },
      events: report
    });
  } catch (err) {
    console.error('getAttendanceReport error:', err);
    return res.status(500).json({ success: false, message: 'Could not load attendance report: ' + err.message });
  }
};

// ============================================================================
// 8. REVIEWS & RATINGS MANAGEMENT
// ============================================================================

// GET /api/admin/reviews
const getAdminReviews = async (req, res) => {
  try {
    const { status = 'all', rating = 'all', search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }
    if (rating && rating !== 'all') {
      where.rating = parseInt(rating);
    }
    if (search && search.trim()) {
      where.comment = { [Op.like]: `%${search.trim()}%` };
    }

    const { count, rows: reviews } = await EventReview.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reviewer', attributes: ['user_id', 'name', 'email'] },
        {
          model: Event,
          as: 'event',
          attributes: ['event_id', 'title'],
          include: [{ model: User, as: 'organizer', attributes: ['user_id', 'name', 'email'] }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Rating breakdown stats
    const totalReviews = await EventReview.count();
    const avgRes = await EventReview.findOne({
      attributes: [[fn('AVG', col('rating')), 'avg']],
      raw: true
    });
    const avgRating = parseFloat(avgRes?.avg || 0).toFixed(1);

    const distRes = await EventReview.findAll({
      attributes: ['rating', [fn('COUNT', col('review_id')), 'count']],
      group: ['rating'],
      raw: true
    });
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distRes.forEach(d => {
      distribution[d.rating] = parseInt(d.count);
    });

    return res.json({
      success: true,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      stats: {
        total_reviews: totalReviews,
        average_rating: parseFloat(avgRating),
        distribution
      },
      reviews
    });
  } catch (err) {
    console.error('getAdminReviews error:', err);
    return res.status(500).json({ success: false, message: 'Could not load reviews: ' + err.message });
  }
};

// PATCH /api/admin/reviews/:id/moderate
const moderateReview = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { status, reason } = req.body;

    if (!['approved', 'flagged', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved, flagged, or hidden.' });
    }

    const review = await EventReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const oldStatus = review.status;
    review.status = status;
    await review.save();

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: `review_${status}`,
      target_type: 'review',
      target_id: reviewId,
      reason: reason || `Changed review moderation status from ${oldStatus} to ${status}`,
      ip_address: getClientIp(req)
    });

    return res.json({
      success: true,
      message: `Review #${reviewId} marked as ${status}.`,
      review
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not moderate review: ' + err.message });
  }
};

// ============================================================================
// 9. PAYMENT & TRANSACTION MANAGEMENT
// ============================================================================

// GET /api/admin/payments
const getAdminPayments = async (req, res) => {
  try {
    const { status = 'all', search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: EventRegistration,
          as: 'registration',
          attributes: ['registration_id', 'user_id', 'event_id'],
          include: [
            { model: User, as: 'user', attributes: ['user_id', 'name', 'email'] },
            {
              model: Event,
              as: 'event',
              attributes: ['event_id', 'title'],
              include: [{ model: User, as: 'organizer', attributes: ['user_id', 'name', 'email'] }]
            },
            { model: EventTicket, as: 'ticket', attributes: ['public_ticket_number'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Accounting reconciliation totals
    const completedSum = await Payment.sum('amount', { where: { status: 'Completed' } });
    const refundedSum = await Payment.sum('amount', { where: { status: 'Refunded' } });
    const pendingSum = await Payment.sum('amount', { where: { status: 'Pending' } });

    const grossProcessed = parseFloat(completedSum || 0);
    const totalRefunded = parseFloat(refundedSum || 0);
    const netReceipts = Math.max(0, grossProcessed - totalRefunded);

    const formattedPayments = payments.map(p => {
      const reg = p.registration || {};
      const ev = reg.event || {};
      const isTest = (p.gateway_order_id && p.gateway_order_id.includes('test')) || true; // Sandbox active
      return {
        payment_id: p.payment_id,
        registration_id: p.registration_id,
        order_id: p.gateway_order_id || `order_sim_${p.payment_id}`,
        payment_ref: p.gateway_payment_id || `pay_sim_${p.payment_id}`,
        event_title: ev.title || 'Meetior Event',
        organizer_name: ev.organizer?.name || 'Organizer',
        attendee_name: reg.user?.name || 'Attendee',
        attendee_email: reg.user?.email || '-',
        ticket_number: reg.ticket?.public_ticket_number || 'Pass Ready',
        amount: parseFloat(p.amount || 0),
        currency: p.currency || 'INR',
        status: p.status,
        mode: isTest ? 'TEST/SIMULATED' : 'LIVE',
        paid_at: p.paid_at || p.created_at
      };
    });

    return res.json({
      success: true,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      reconciliation: {
        total_gross_completed: grossProcessed,
        total_refunded: totalRefunded,
        net_receipts: netReceipts,
        total_pending: parseFloat(pendingSum || 0),
        currency: 'INR',
        gateway_mode: 'TEST / SIMULATED (Razorpay Sandbox)'
      },
      payments: formattedPayments
    });
  } catch (err) {
    console.error('getAdminPayments error:', err);
    return res.status(500).json({ success: false, message: 'Could not load payments: ' + err.message });
  }
};

// ============================================================================
// 10. PLATFORM FINANCE & REVENUE REPORTS
// ============================================================================

// GET /api/admin/finance/platform-reports
const getPlatformFinancialReports = async (req, res) => {
  try {
    const commissionPercent = await getPlatformCommissionPercent();

    // Gross Sales & Refunds
    const completedSum = await Payment.sum('amount', { where: { status: 'Completed' } });
    const refundedSum = await Payment.sum('amount', { where: { status: 'Refunded' } });

    const grossSales = parseFloat(completedSum || 0);
    const totalRefunds = parseFloat(refundedSum || 0);
    const platformRevenue = parseFloat((grossSales * (commissionPercent / 100)).toFixed(2));
    const organizerNet = Math.max(0, parseFloat((grossSales - totalRefunds - platformRevenue).toFixed(2)));

    // Top 5 Highest Grossing Events
    const events = await Event.findAll({
      attributes: ['event_id', 'title', 'price', 'capacity', 'organizer_id'],
      include: [
        { model: User, as: 'organizer', attributes: ['name'] },
        { model: Category, as: 'category', attributes: ['name'] }
      ]
    });

    const eventRevenues = await Promise.all(events.map(async (ev) => {
      const regs = await EventRegistration.findAll({
        where: { event_id: ev.event_id },
        attributes: ['registration_id']
      });
      const regIds = regs.map(r => r.registration_id);
      let eventGross = 0;
      if (regIds.length > 0) {
        const sum = await Payment.sum('amount', {
          where: { registration_id: { [Op.in]: regIds }, status: 'Completed' }
        });
        eventGross = parseFloat(sum || 0);
      }
      return {
        event_id: ev.event_id,
        title: ev.title,
        organizer: ev.organizer?.name || 'Organizer',
        category: ev.category?.name || 'General',
        gross_revenue: eventGross
      };
    }));

    eventRevenues.sort((a, b) => b.gross_revenue - a.gross_revenue);
    const topEvents = eventRevenues.slice(0, 5);

    // Paid vs Free Events
    const paidEventsCount = await Event.count({ where: { price: { [Op.gt]: 0 } } });
    const freeEventsCount = await Event.count({ where: { price: 0 } });

    return res.json({
      success: true,
      overview: {
        gross_sales: grossSales,
        total_refunds: totalRefunds,
        commission_percent: commissionPercent,
        platform_revenue: platformRevenue,
        estimated_organizer_earnings: organizerNet,
        currency: 'INR',
        gateway_mode: 'TEST / SIMULATED (Razorpay Sandbox Mode)',
        actual_payout_status: 'Actual payouts not configured'
      },
      top_events: topEvents,
      paid_vs_free: {
        paid_events: paidEventsCount,
        free_events: freeEventsCount,
        total: paidEventsCount + freeEventsCount
      }
    });
  } catch (err) {
    console.error('getPlatformFinancialReports error:', err);
    return res.status(500).json({ success: false, message: 'Could not generate finance report: ' + err.message });
  }
};

// ============================================================================
// 11. REPORTS & COMPLAINTS
// ============================================================================

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const reports = await Report.findAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['user_id', 'name', 'email'] },
        { model: User, as: 'reviewer_admin', attributes: ['user_id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    return res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    console.error('getReports error:', err);
    return res.status(500).json({ success: false, message: 'Could not load reports: ' + err.message });
  }
};

// PATCH /api/admin/reports/:id
const updateReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status, resolution_notes, take_action } = req.body;

    if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be reviewed, resolved, or dismissed.' });
    }

    const report = await Report.findByPk(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.status = status;
    report.reviewed_by = req.user.user_id;
    report.reviewed_at = new Date();
    await report.save();

    // Optional direct automated moderation action
    if (take_action && status === 'resolved') {
      if (report.target_type === 'user' || report.target_type === 'organizer') {
        const u = await User.findByPk(report.target_id);
        if (u) {
          u.account_status = 'suspended';
          await u.save();
        }
      } else if (report.target_type === 'event') {
        const e = await Event.findByPk(report.target_id);
        if (e) {
          e.moderation_status = 'Hidden';
          await e.save();
        }
      } else if (report.target_type === 'review') {
        const r = await EventReview.findByPk(report.target_id);
        if (r) {
          r.status = 'hidden';
          await r.save();
        }
      }
    }

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: `report_${status}`,
      target_type: 'report',
      target_id: reportId,
      reason: resolution_notes || `Report #${reportId} marked as ${status}`,
      metadata_json: { target_type: report.target_type, target_id: report.target_id, automated_action: take_action || 'none' },
      ip_address: getClientIp(req)
    });

    return res.json({ success: true, message: `Report marked as ${status}.`, report });
  } catch (err) {
    console.error('updateReport error:', err);
    return res.status(500).json({ success: false, message: 'Could not update report: ' + err.message });
  }
};

// ============================================================================
// 12. CATEGORY & LOCATION MANAGEMENT
// ============================================================================

// GET /api/admin/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    const augmented = await Promise.all(categories.map(async (c) => {
      const eventCount = await Event.count({ where: { category_id: c.category_id } });
      return {
        ...c.toJSON(),
        event_count: eventCount
      };
    }));

    return res.json({ success: true, categories: augmented });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load categories.' });
  }
};

// POST /api/admin/categories
const createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const cat = await Category.create({ name: name.trim(), slug, icon: icon || '🎪' });

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'category_created',
      target_type: 'category',
      target_id: cat.category_id,
      reason: `Created category: ${cat.name}`,
      ip_address: getClientIp(req)
    });

    return res.status(201).json({ success: true, message: 'Category created successfully!', category: cat });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not create category: ' + err.message });
  }
};

// PATCH /api/admin/categories/:id
const updateCategory = async (req, res) => {
  try {
    const catId = parseInt(req.params.id);
    const { name, icon } = req.body;

    const cat = await Category.findByPk(catId);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name) cat.name = name.trim();
    if (icon) cat.icon = icon.trim();
    await cat.save();

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'category_updated',
      target_type: 'category',
      target_id: catId,
      reason: `Updated category #${catId}: ${cat.name}`,
      ip_address: getClientIp(req)
    });

    return res.json({ success: true, message: 'Category updated!', category: cat });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not update category: ' + err.message });
  }
};

// GET /api/admin/locations/audit
const getLocationAudit = async (req, res) => {
  try {
    const totalStates = await State.count();
    const totalDistricts = await District.count();
    const totalCities = await City.count();

    // Top cities with events
    const [cityEventCounts] = await sequelize.query(`
      SELECT l.city, COUNT(e.event_id) as event_count 
      FROM Locations l
      LEFT JOIN Events e ON l.location_id = e.location_id
      GROUP BY l.city
      ORDER BY event_count DESC
      LIMIT 15
    `);

    // Check for duplicate city names
    const [duplicates] = await sequelize.query(`
      SELECT city_name, COUNT(*) as cnt 
      FROM Cities 
      GROUP BY city_name 
      HAVING cnt > 1 
      LIMIT 10
    `);

    return res.json({
      success: true,
      totals: {
        states: totalStates,
        districts: totalDistricts,
        cities: totalCities
      },
      top_cities_with_events: cityEventCounts,
      duplicate_city_names: duplicates
    });
  } catch (err) {
    console.error('getLocationAudit error:', err);
    return res.status(500).json({ success: false, message: 'Location audit error: ' + err.message });
  }
};

// ============================================================================
// 13. ADMIN NOTIFICATIONS & BROADCAST ANNOUNCEMENTS
// ============================================================================

// GET /api/admin/notifications/alerts
const getAdminAlerts = async (req, res) => {
  try {
    const pendingReports = await Report.count({ where: { status: 'pending' } });
    const unreviewedEvents = await Event.count({ where: { moderation_status: 'UnderReview' } });
    const suspendedUsers = await User.count({ where: { account_status: 'suspended' } });

    const alerts = [];
    if (pendingReports > 0) {
      alerts.push({
        type: 'report',
        title: 'Pending Content Reports',
        message: `${pendingReports} report(s) require review and resolution.`,
        urgency: 'high'
      });
    }
    if (unreviewedEvents > 0) {
      alerts.push({
        type: 'event',
        title: 'Events Under Review',
        message: `${unreviewedEvents} event(s) currently under moderation review.`,
        urgency: 'medium'
      });
    }
    if (suspendedUsers > 0) {
      alerts.push({
        type: 'user',
        title: 'Suspended Accounts',
        message: `${suspendedUsers} user account(s) currently suspended.`,
        urgency: 'info'
      });
    }

    return res.json({ success: true, alerts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load alerts.' });
  }
};

// POST /api/admin/broadcast
const sendAdminBroadcast = async (req, res) => {
  try {
    const { target_audience = 'all', title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const where = { account_status: 'active' };
    if (target_audience === 'attendees') where.role = 'Attendee';
    if (target_audience === 'organizers') where.role = 'Organizer';

    const users = await User.findAll({ where, attributes: ['user_id'] });
    const userIds = users.map(u => u.user_id);

    // Save notification for each user
    const notifs = userIds.map(uid => ({
      user_id: uid,
      notification_type: 'admin_announcement',
      title: `📢 ${title}`,
      message,
      is_read: false,
      created_at: new Date()
    }));

    if (notifs.length > 0) {
      await Notification.bulkCreate(notifs);
    }

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'broadcast_announcement_sent',
      target_type: 'notification',
      target_id: 0,
      reason: `Broadcast "${title}" sent to ${target_audience} (${userIds.length} recipients)`,
      ip_address: getClientIp(req)
    });

    return res.json({
      success: true,
      message: `Announcement broadcast sent to ${userIds.length} users! 📢`,
      recipient_count: userIds.length
    });
  } catch (err) {
    console.error('sendAdminBroadcast error:', err);
    return res.status(500).json({ success: false, message: 'Could not send broadcast: ' + err.message });
  }
};

// ============================================================================
// 14. AUDIT TRAIL & ADMIN PERMISSIONS (RBAC)
// ============================================================================

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { action, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (action && action !== 'all') {
      where.action = action;
    }
    if (search && search.trim()) {
      where.reason = { [Op.like]: `%${search.trim()}%` };
    }

    const { count, rows: logs } = await AdminAuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'admin', attributes: ['user_id', 'name', 'email', 'admin_role'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.json({
      success: true,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      logs
    });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return res.status(500).json({ success: false, message: 'Could not load audit logs: ' + err.message });
  }
};

// GET /api/admin/roles-permissions
const getRolesAndPermissions = async (req, res) => {
  try {
    const permissions = await AdminRolePermission.findAll({
      order: [['role_name', 'ASC'], ['permission_key', 'ASC']]
    });

    const admins = await User.findAll({
      where: { role: 'Admin' },
      attributes: ['user_id', 'name', 'email', 'admin_role', 'account_status', 'mfa_enabled', 'last_login_at', 'created_at'],
      order: [['name', 'ASC']]
    });

    return res.json({
      success: true,
      permissions,
      admins
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load roles and permissions.' });
  }
};

// POST /api/admin/users/create-admin (Super Admin only)
const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, admin_role = 'Support Admin' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hash,
      role: 'Admin',
      admin_role: admin_role,
      account_status: 'active',
      city: 'Ahmedabad'
    });

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'admin_user_provisioned',
      target_type: 'user',
      target_id: newAdmin.user_id,
      reason: `Super Admin provisioned new administrator "${newAdmin.name}" with role "${admin_role}"`,
      ip_address: getClientIp(req)
    });

    return res.status(201).json({
      success: true,
      message: `Administrator ${newAdmin.name} provisioned successfully!`,
      user: {
        user_id: newAdmin.user_id,
        name: newAdmin.name,
        email: newAdmin.email,
        admin_role: newAdmin.admin_role
      }
    });
  } catch (err) {
    console.error('createAdminUser error:', err);
    return res.status(500).json({ success: false, message: 'Could not create admin: ' + err.message });
  }
};

// PATCH /api/admin/users/:id/admin-role (Super Admin only)
const updateAdminRole = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const { admin_role } = req.body;

    if (!['Super Admin', 'Event Moderator', 'Support Admin', 'Finance Admin'].includes(admin_role)) {
      return res.status(400).json({ success: false, message: 'Invalid admin role.' });
    }

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser || targetUser.role !== 'Admin') {
      return res.status(404).json({ success: false, message: 'Administrator account not found.' });
    }

    const oldRole = targetUser.admin_role;
    targetUser.admin_role = admin_role;
    await targetUser.save();

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'admin_role_updated',
      target_type: 'user',
      target_id: targetUserId,
      reason: `Changed administrator ${targetUser.name} role from ${oldRole} to ${admin_role}`,
      ip_address: getClientIp(req)
    });

    return res.json({
      success: true,
      message: `Admin role updated to ${admin_role}.`,
      user: targetUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not update role: ' + err.message });
  }
};

// PATCH /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { account_status, reason } = req.body;

    if (!['active', 'suspended'].includes(account_status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be active or suspended.' });
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Protection: Prevent suspending the last active administrator
    if (targetUser.role === 'Admin' && account_status === 'suspended') {
      const activeAdminCount = await User.count({ where: { role: 'Admin', account_status: 'active' } });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied: Cannot suspend the last active administrator account.'
        });
      }
    }

    const oldStatus = targetUser.account_status;
    targetUser.account_status = account_status;
    await targetUser.save();

    // Log admin audit action
    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: account_status === 'suspended' ? 'user_suspended' : 'user_reactivated',
      target_type: 'user',
      target_id: userId,
      reason: reason || `Changed account status from ${oldStatus} to ${account_status}`,
      metadata_json: { target_email: targetUser.email, target_role: targetUser.role },
      ip_address: getClientIp(req)
    });

    return res.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) is now ${account_status}.`,
      user: targetUser
    });
  } catch (err) {
    console.error('updateUserStatus error:', err);
    return res.status(500).json({ success: false, message: 'Could not update user status: ' + err.message });
  }
};

// ============================================================================
// 15. PLATFORM SETTINGS
// ============================================================================

// GET /api/admin/settings
const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSetting.findAll({
      order: [['category', 'ASC'], ['setting_key', 'ASC']]
    });
    const settingsMap = Object.fromEntries(settings.map(s => [s.setting_key, s.setting_value]));
    return res.json({ success: true, settings, settings_map: settingsMap });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load platform settings.' });
  }
};

// PATCH /api/admin/settings
const updatePlatformSettings = async (req, res) => {
  try {
    const { settings, reason } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings key-value map required.' });
    }

    for (const [key, val] of Object.entries(settings)) {
      const existing = await PlatformSetting.findOne({ where: { setting_key: key } });
      if (existing) {
        existing.setting_value = String(val);
        existing.updated_by = req.user.user_id;
        await existing.save();
      } else {
        await PlatformSetting.create({
          setting_key: key,
          setting_value: String(val),
          category: 'general',
          description: key,
          updated_by: req.user.user_id
        });
      }

      // Keep alias in sync if cancellation hours setting
      if (key === 'cancellation_cutoff_hours') {
        const alt = await PlatformSetting.findOne({ where: { setting_key: 'max_booking_cancellation_hours' } });
        if (alt) {
          alt.setting_value = String(val);
          await alt.save();
        }
      } else if (key === 'max_booking_cancellation_hours') {
        const alt = await PlatformSetting.findOne({ where: { setting_key: 'cancellation_cutoff_hours' } });
        if (alt) {
          alt.setting_value = String(val);
          await alt.save();
        }
      }
    }

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'platform_settings_updated',
      target_type: 'setting',
      target_id: 0,
      reason: reason || 'Platform settings modified',
      metadata_json: settings,
      ip_address: getClientIp(req)
    });

    return res.json({ success: true, message: 'Platform settings updated successfully!' });
  } catch (err) {
    console.error('updatePlatformSettings error:', err);
    return res.status(500).json({ success: false, message: 'Could not update settings: ' + err.message });
  }
};


// 16. DATA MANAGEMENT (ADD & REMOVE DATA)

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = parseInt(req.params.id);
    if (!userId) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Valid user ID is required.' });
    }

    if (req.user.user_id === userId) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Cannot delete your own administrator account.' });
    }

    const targetUser = await User.findByPk(userId, { transaction: t });
    if (!targetUser) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser.email === 'admin@meetior.in') {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'The primary system administrator account cannot be deleted.' });
    }

    // Cascade delete associated child data
    const userEvents = await Event.findAll({ where: { organizer_id: userId }, attributes: ['event_id'], transaction: t });
    const userEventIds = userEvents.map(e => e.event_id);

    const regConds = [{ user_id: userId }];
    if (userEventIds.length > 0) regConds.push({ event_id: { [Op.in]: userEventIds } });
    const regs = await EventRegistration.findAll({ where: { [Op.or]: regConds }, attributes: ['registration_id'], transaction: t });
    const regIds = regs.map(r => r.registration_id);

    if (regIds.length > 0) {
      const tickets = await EventTicket.findAll({ where: { registration_id: { [Op.in]: regIds } }, attributes: ['ticket_id'], transaction: t });
      const ticketIds = tickets.map(tk => tk.ticket_id);
      if (ticketIds.length > 0) {
        await EventCheckIn.destroy({ where: { ticket_id: { [Op.in]: ticketIds } }, transaction: t });
      }
      await Payment.destroy({ where: { registration_id: { [Op.in]: regIds } }, transaction: t });
      await EventTicket.destroy({ where: { registration_id: { [Op.in]: regIds } }, transaction: t });
      await EventRegistration.destroy({ where: { registration_id: { [Op.in]: regIds } }, transaction: t });
    }

    await EventCheckIn.destroy({ where: { checked_in_by: userId }, transaction: t });

    const revConds = [{ user_id: userId }];
    if (userEventIds.length > 0) revConds.push({ event_id: { [Op.in]: userEventIds } });
    await EventReview.destroy({ where: { [Op.or]: revConds }, transaction: t });
    await EventInteraction.destroy({ where: { [Op.or]: revConds }, transaction: t });
    await Notification.destroy({ where: { user_id: userId }, transaction: t });

    if (userEventIds.length > 0) {
      await Event.destroy({ where: { event_id: { [Op.in]: userEventIds } }, transaction: t });
    }

    await targetUser.destroy({ transaction: t });

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'USER_DELETED',
      target_type: 'User',
      target_id: String(userId),
      details: JSON.stringify({ name: targetUser.name, email: targetUser.email, role: targetUser.role }),
      ip_address: getClientIp(req)
    }, { transaction: t });

    await t.commit();
    return res.json({ success: true, message: `User "${targetUser.name}" (#${userId}) and associated data removed successfully.` });
  } catch (err) {
    await t.rollback();
    console.error('deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Could not delete user: ' + err.message });
  }
};

// POST /api/admin/users/create
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'Attendee', city = 'Ahmedabad', phone_number = '', admin_role = null } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password_hash,
      role: ['Admin', 'Organizer', 'Attendee'].includes(role) ? role : 'Attendee',
      city: city.trim(),
      phone_number: phone_number.trim(),
      account_status: 'active',
      admin_role: role === 'Admin' ? (admin_role || 'Operations Admin') : null
    });

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'USER_CREATED',
      target_type: 'User',
      target_id: String(newUser.user_id),
      details: JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role }),
      ip_address: getClientIp(req)
    });

    return res.status(201).json({
      success: true,
      message: `${newUser.role} user "${newUser.name}" created successfully.`,
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        city: newUser.city
      }
    });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ success: false, message: 'Could not create user: ' + err.message });
  }
};

// DELETE /api/admin/events/:id
const deleteEvent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const eventId = parseInt(req.params.id);
    if (!eventId) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Valid event ID is required.' });
    }

    const targetEvent = await Event.findByPk(eventId, { transaction: t });
    if (!targetEvent) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const regs = await EventRegistration.findAll({ where: { event_id: eventId }, attributes: ['registration_id'], transaction: t });
    const regIds = regs.map(r => r.registration_id);

    if (regIds.length > 0) {
      const tickets = await EventTicket.findAll({ where: { registration_id: { [Op.in]: regIds } }, attributes: ['ticket_id'], transaction: t });
      const ticketIds = tickets.map(tk => tk.ticket_id);
      if (ticketIds.length > 0) {
        await EventCheckIn.destroy({ where: { ticket_id: { [Op.in]: ticketIds } }, transaction: t });
      }
      await Payment.destroy({ where: { registration_id: { [Op.in]: regIds } }, transaction: t });
      await EventTicket.destroy({ where: { registration_id: { [Op.in]: regIds } }, transaction: t });
      await EventRegistration.destroy({ where: { registration_id: { [Op.in]: regIds } }, transaction: t });
    }

    await EventCheckIn.destroy({ where: { event_id: eventId }, transaction: t });
    await EventReview.destroy({ where: { event_id: eventId }, transaction: t });
    await EventInteraction.destroy({ where: { event_id: eventId }, transaction: t });

    await targetEvent.destroy({ transaction: t });

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'EVENT_DELETED',
      target_type: 'Event',
      target_id: String(eventId),
      details: JSON.stringify({ title: targetEvent.title, organizer_id: targetEvent.organizer_id }),
      ip_address: getClientIp(req)
    }, { transaction: t });

    await t.commit();
    return res.json({ success: true, message: `Event "${targetEvent.title}" (#${eventId}) deleted successfully.` });
  } catch (err) {
    await t.rollback();
    console.error('deleteEvent error:', err);
    return res.status(500).json({ success: false, message: 'Could not delete event: ' + err.message });
  }
};

// POST /api/admin/events/create
const createAdminEvent = async (req, res) => {
  try {
    const {
      title, description, category_id = 1, organizer_id,
      price = 0, currency = 'INR', capacity = 50,
      start_datetime, end_datetime,
      venue_name = 'City Center', formatted_address = 'Ahmedabad, Gujarat, India',
      city = 'Ahmedabad', district = 'Ahmedabad', state = 'Gujarat', postal_code = '380001',
      latitude = 23.0225, longitude = 72.5714
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    let finalOrgId = organizer_id;
    if (!finalOrgId) {
      const defaultOrg = await User.findOne({ where: { role: 'Organizer' } });
      finalOrgId = defaultOrg ? defaultOrg.user_id : req.user.user_id;
    }

    const [loc] = await Location.findOrCreate({
      where: { venue_name },
      defaults: {
        venue_name,
        formatted_address,
        locality: venue_name,
        city,
        district,
        state,
        postal_code,
        discovery_city: city,
        latitude: parseFloat(latitude) || 23.0225,
        longitude: parseFloat(longitude) || 72.5714
      }
    });

    const now = new Date();
    const start = start_datetime ? new Date(start_datetime) : new Date(now.getTime() + 3 * 24 * 3600 * 1000);
    const end = end_datetime ? new Date(end_datetime) : new Date(start.getTime() + 3 * 3600 * 1000);

    const newEvent = await Event.create({
      organizer_id: finalOrgId,
      category_id: parseInt(category_id) || 1,
      location_id: loc.location_id,
      title: title.trim(),
      description: description.trim(),
      start_datetime: start,
      end_datetime: end,
      capacity: parseInt(capacity) || 50,
      price: parseFloat(price) || 0,
      currency: currency || 'INR',
      status: 'Published'
    });

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'EVENT_CREATED',
      target_type: 'Event',
      target_id: String(newEvent.event_id),
      details: JSON.stringify({ title: newEvent.title, organizer_id: finalOrgId }),
      ip_address: getClientIp(req)
    });

    return res.status(201).json({
      success: true,
      message: `Event "${newEvent.title}" created successfully.`,
      event: newEvent
    });
  } catch (err) {
    console.error('createAdminEvent error:', err);
    return res.status(500).json({ success: false, message: 'Could not create event: ' + err.message });
  }
};

// DELETE /api/admin/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const catId = parseInt(req.params.id);
    const cat = await Category.findByPk(catId);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    await Event.update({ category_id: 1 }, { where: { category_id: catId } });
    await cat.destroy();

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'CATEGORY_DELETED',
      target_type: 'Category',
      target_id: String(catId),
      details: JSON.stringify({ name: cat.name, slug: cat.slug }),
      ip_address: getClientIp(req)
    });

    return res.json({ success: true, message: `Category "${cat.name}" deleted successfully.` });
  } catch (err) {
    console.error('deleteCategory error:', err);
    return res.status(500).json({ success: false, message: 'Could not delete category: ' + err.message });
  }
};

// POST /api/admin/data/clean-demo
const cleanDemoData = async (req, res) => {
  try {
    const { cleanDemoUsersAndData } = require('../utils/cleanDemoUsers');
    const result = await cleanDemoUsersAndData();

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'PURGE_DEMO_DATA',
      target_type: 'Database',
      target_id: 'meetior_db',
      details: JSON.stringify(result),
      ip_address: getClientIp(req)
    });

    return res.json({
      success: true,
      message: 'Demo users, organizers, and temporary test records have been purged successfully!',
      result
    });
  } catch (err) {
    console.error('cleanDemoData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to purge demo data: ' + err.message });
  }
};

// POST /api/admin/data/seed-demo
const seedDemoData = async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const path = require('path');
    const seedOutput = execSync('node utils/seedPublicGatherings.js', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });

    await AdminAuditLog.create({
      admin_id: req.user.user_id,
      action: 'SEED_DEMO_DATA',
      target_type: 'Database',
      target_id: 'meetior_db',
      details: 'Public gatherings and events re-seeded',
      ip_address: getClientIp(req)
    });

    return res.json({
      success: true,
      message: 'Demo public gatherings and events seeded successfully!',
      output: seedOutput.slice(-300)
    });
  } catch (err) {
    console.error('seedDemoData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to seed demo data: ' + err.message });
  }
};

module.exports = {
  // 1. Auth & MFA
  adminLogin,
  adminVerifyMfa,
  adminLogout,
  getAdminProfile,
  setupAdminMfa,
  confirmAdminMfa,
  disableAdminMfa,

  // 2. Overview
  getAdminOverview,

  // 3. Attendees
  getAttendees,
  getAttendeeDetails,
  updateUserStatus,

  // 4. Organizers
  getOrganizers,
  getOrganizerDetails,

  // 5. Earnings & Revenue
  getOrganizerEarningsReport,

  // 6. Events
  getAdminEvents,
  getEventDetails,
  moderateEvent,

  // 7. Attendance
  getAttendanceReport,

  // 8. Reviews
  getAdminReviews,
  moderateReview,

  // 9. Payments
  getAdminPayments,

  // 10. Platform Finance
  getPlatformFinancialReports,

  // 11. Reports & Safety
  getReports,
  updateReport,

  // 12. Categories & Locations
  getCategories,
  createCategory,
  updateCategory,
  getLocationAudit,

  // 13. Notifications & Broadcast
  getAdminAlerts,
  sendAdminBroadcast,

  // 14. Audit & Roles
  getAuditLogs,
  getRolesAndPermissions,
  createAdminUser,
  updateAdminRole,

  // 15. Settings
  getPlatformSettings,
  updatePlatformSettings,

  // Backward compatibility alias:
  // 16. Data Management
  deleteUser,
  createUser,
  deleteEvent,
  createAdminEvent,
  deleteCategory,
  cleanDemoData,
  seedDemoData,

  getUsers: getAttendees
};
