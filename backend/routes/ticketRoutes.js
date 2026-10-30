'use strict';
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getTicket } = require('../controllers/registrationController');

router.get('/:id', authMiddleware, getTicket);
router.get('/:id/download', authMiddleware, getTicket);

module.exports = router;
