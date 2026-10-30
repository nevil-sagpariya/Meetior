'use strict';
const { Report } = require('../models');

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const { target_type, target_id, reason, description } = req.body;
    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ success: false, message: 'target_type, target_id, and reason are required.' });
    }

    if (!['event', 'organizer', 'user', 'review', 'demand'].includes(target_type)) {
      return res.status(400).json({ success: false, message: 'Invalid target_type.' });
    }

    const report = await Report.create({
      reporter_id: req.user.user_id,
      target_type,
      target_id: parseInt(target_id),
      reason: reason.trim(),
      description: description ? description.trim() : null,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your report. Our moderation team will review it.',
      report_id: report.report_id,
    });
  } catch (err) {
    console.error('createReport error:', err);
    return res.status(500).json({ success: false, message: 'Could not submit report: ' + err.message });
  }
};

module.exports = { createReport };
