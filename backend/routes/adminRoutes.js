'use strict';
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  requireAdmin,
  requirePermission
} = require('../middleware/adminPermissionMiddleware');
const {
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

  // 3. Attendees & Users
  getAttendees,
  getAttendeeDetails,
  updateUserStatus,
  createUser,
  deleteUser,

  // 4. Organizers
  getOrganizers,
  getOrganizerDetails,

  // 5. Earnings & Revenue
  getOrganizerEarningsReport,

  // 6. Events
  getAdminEvents,
  getEventDetails,
  moderateEvent,
  createAdminEvent,
  deleteEvent,

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
  deleteCategory,
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

  // 16. Database & Demo Data Maintenance
  cleanDemoData,
  seedDemoData,
} = require('../controllers/adminController');

// ────────────────────────────────────────────────────────────
// FEATURE SWITCH: Check if Admin module is disabled
// ────────────────────────────────────────────────────────────
router.use((_req, res, next) => {
  if (process.env.ADMIN_ENABLED === 'false' && process.env.NODE_ENV !== 'test') {
    return res.status(503).json({
      success: false,
      message: 'Admin module is currently disabled for this deployment.'
    });
  }
  next();
});

// ────────────────────────────────────────────────────────────
// PUBLIC ADMIN AUTHENTICATION (Rate-limited, admin-only check)
// ────────────────────────────────────────────────────────────
router.post('/auth/login', adminLogin);
router.post('/auth/verify-mfa', adminVerifyMfa);

// ────────────────────────────────────────────────────────────
// PROTECTED ADMIN ROUTES (Require valid JWT AND Admin role)
// ────────────────────────────────────────────────────────────
router.use(authMiddleware, requireAdmin);

// Session & MFA
router.post('/auth/logout', adminLogout);
router.get('/auth/me', getAdminProfile);
router.post('/auth/mfa/setup', setupAdminMfa);
router.post('/auth/mfa/confirm', confirmAdminMfa);
router.post('/auth/mfa/disable', disableAdminMfa);

// 2. Main Dashboard
router.get('/overview', getAdminOverview);

// 3. Attendees & User Management
router.get('/attendees', requirePermission('users:read'), getAttendees);
router.get('/attendees/:id', requirePermission('users:read'), getAttendeeDetails);
router.get('/users', requirePermission('users:read'), getAttendees); // Backward compatibility
router.post('/users/create', requirePermission('users:moderate'), createUser);
router.patch('/users/:id/status', requirePermission('users:moderate'), updateUserStatus);
router.delete('/users/:id', requirePermission('users:moderate'), deleteUser);

// 4. Organizers
router.get('/organizers', requirePermission('users:read'), getOrganizers);
router.get('/organizers/:id', requirePermission('users:read'), getOrganizerDetails);

// 5. Earnings & Revenue Tracking
router.get('/finance/organizer-earnings', requirePermission('organizers:earnings'), getOrganizerEarningsReport);

// 6. Events & Event Management
router.get('/events', requirePermission('events:read'), getAdminEvents);
router.get('/events/:id', requirePermission('events:read'), getEventDetails);
router.post('/events/create', requirePermission('events:moderate'), createAdminEvent);
router.patch('/events/:id/moderate', requirePermission('events:moderate'), moderateEvent);
router.delete('/events/:id', requirePermission('events:moderate'), deleteEvent);

// 7. Attendance
router.get('/attendance', requirePermission('attendance:read'), getAttendanceReport);

// 8. Reviews
router.get('/reviews', requirePermission('reviews:read'), getAdminReviews);
router.patch('/reviews/:id/moderate', requirePermission('reviews:moderate'), moderateReview);

// 9. Payments & Transactions
router.get('/payments', requirePermission('payments:read'), getAdminPayments);

// 10. Platform Financial Reports
router.get('/finance/reports', requirePermission('finance:read'), getPlatformFinancialReports);

// 11. Reports & Safety
router.get('/reports', requirePermission('reports:read'), getReports);
router.patch('/reports/:id', requirePermission('reports:resolve'), updateReport);
router.patch('/reports/:id/status', requirePermission('reports:resolve'), updateReport);

// 12. Categories & Locations
router.get('/categories', getCategories);
router.post('/categories', requirePermission('categories:manage'), createCategory);
router.patch('/categories/:id', requirePermission('categories:manage'), updateCategory);
router.delete('/categories/:id', requirePermission('categories:manage'), deleteCategory);
router.get('/locations/audit', getLocationAudit);

// 13. Notifications & Broadcast
router.get('/notifications/alerts', getAdminAlerts);
router.post('/broadcast', sendAdminBroadcast);

// 14. Audit Logs & RBAC
router.get('/audit-logs', requirePermission('audit:read'), getAuditLogs);
router.get('/roles-permissions', getRolesAndPermissions);
router.post('/users/create-admin', requirePermission('*'), createAdminUser);
router.patch('/users/:id/admin-role', requirePermission('*'), updateAdminRole);

// 15. Platform Settings
router.get('/settings', getPlatformSettings);
router.patch('/settings', requirePermission('*'), updatePlatformSettings);

// 16. Database & Demo Data Maintenance
router.post('/data/clean-demo', requirePermission('*'), cleanDemoData);
router.post('/data/seed-demo', requirePermission('*'), seedDemoData);

module.exports = router;
