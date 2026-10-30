'use strict';
const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { requireOrganizer } = require('../middleware/roleMiddleware');
const {
  getDemands,
  createDemand,
  getDemandById,
  supportDemand,
  unsupportDemand,
  respondToDemand,
} = require('../controllers/demandController');

router.get('/', optionalAuth, getDemands);
router.post('/', authMiddleware, createDemand);
router.get('/:id', optionalAuth, getDemandById);
router.post('/:id/support', authMiddleware, supportDemand);
router.delete('/:id/support', authMiddleware, unsupportDemand);
router.post('/:id/responses', authMiddleware, requireOrganizer, respondToDemand);

module.exports = router;
