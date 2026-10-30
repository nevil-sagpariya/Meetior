'use strict';
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment, webhook, demoWalletPay, getUpiQr } = require('../controllers/paymentController');

router.post('/create-order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);
router.post('/demo-wallet-pay', authMiddleware, demoWalletPay);
router.get('/upi-qr', getUpiQr);
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

module.exports = router;
