'use strict';

const authMiddleware = require('./authMiddleware');
const roleMiddleware = require('./roleMiddleware');
const uploadMiddleware = require('./uploadMiddleware');
const adminPermissionMiddleware = require('./adminPermissionMiddleware');

module.exports = {
  ...authMiddleware,
  ...roleMiddleware,
  ...uploadMiddleware,
  ...adminPermissionMiddleware,
  authMiddleware: authMiddleware.authMiddleware || authMiddleware,
  roleMiddleware: roleMiddleware.roleMiddleware || roleMiddleware,
  uploadMiddleware: uploadMiddleware.uploadMiddleware || uploadMiddleware,
  adminPermissionMiddleware
};
