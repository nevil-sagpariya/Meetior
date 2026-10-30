'use strict';

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `This action requires ${roles.join(' or ')} role.`,
    });
  }
  next();
};

const requireOrganizer = requireRole('Organizer');
const requireAttendee  = requireRole('Attendee');
const requireAdmin     = requireRole('Admin');

module.exports = { requireRole, requireOrganizer, requireAttendee, requireAdmin };
