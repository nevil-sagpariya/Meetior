'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');
const { EventRegistration, Payment, EventTicket, Event, sequelize } = require('../models');
const notificationService = require('../services/notificationService');
const { createTicketQrToken, hashQrToken } = require('../utils/ticketQr');

let Razorpay;
try { Razorpay = require('razorpay'); } catch (_) {}

const getRazorpay = () => {
  if (!Razorpay) throw new Error('Razorpay package not installed.');
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_') || !process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_KEY_ID.includes('your_key') ||
      process.env.RAZORPAY_KEY_SECRET.includes('your_razorpay')) {
    throw new Error('Razorpay Test Mode is not configured. Add valid test keys to backend/.env.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// POST /api/payments/create-order
const createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const hasValidKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_') &&
      process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.includes('your_key') &&
      !process.env.RAZORPAY_KEY_SECRET.includes('your_razorpay');

    if (!hasValidKeys) {
      await t.rollback();
      return res.status(503).json({ success: false, message: 'Paid checkout is unavailable until Razorpay Test Mode keys are configured.' });
    }
    const { registration_id } = req.body;
    const reg = await EventRegistration.findByPk(registration_id, {
      include: [{ model: Event, as: 'event' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!reg || reg.user_id !== req.user.user_id) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (reg.registration_status === 'Confirmed') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Registration is already confirmed.' });
    }

    const amountPaise = Math.round(parseFloat(reg.event.price) * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'This event has an invalid payment amount.' });
    }

    let order;
    let isSimulated = false;
    let simulatedPaymentId = null;
    let simulatedSignature = null;

    try {
      order = await getRazorpay().orders.create({
        amount: amountPaise, currency: reg.event.currency || 'INR', receipt: 'reg_' + registration_id
      });
    } catch (rzpErr) {
      if (process.env.RAZORPAY_KEY_ID && (process.env.RAZORPAY_KEY_ID.includes('placeholder') || process.env.NODE_ENV !== 'production')) {
        isSimulated = true;
        const simOrderId = 'order_sim_' + crypto.randomBytes(8).toString('hex');
        simulatedPaymentId = 'pay_sim_' + crypto.randomBytes(8).toString('hex');
        simulatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(simOrderId + '|' + simulatedPaymentId).digest('hex');
        order = {
          id: simOrderId,
          amount: amountPaise,
          currency: reg.event.currency || 'INR'
        };
      } else {
        throw rzpErr;
      }
    }

    // Record pending payment in MySQL
    let payment = await Payment.findOne({ where: { registration_id }, transaction: t });
    if (payment) {
      payment.gateway_order_id = order.id;
      payment.amount = reg.event.price;
      payment.currency = reg.event.currency || 'INR';
      payment.status = 'Pending';
      await payment.save({ transaction: t });
    } else {
      payment = await Payment.create({
        registration_id,
        gateway: 'razorpay',
        gateway_order_id: order.id,
        amount: reg.event.price,
        currency: reg.event.currency || 'INR',
        status: 'Pending',
      }, { transaction: t });
    }

    await t.commit();
    return res.json({
      success: true,
      order_id: order.id,
      amount: amountPaise,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      is_simulated: isSimulated,
      simulated_payment_id: simulatedPaymentId,
      simulated_signature: simulatedSignature,
      mode: isSimulated ? 'razorpay_sandbox_simulator' : 'razorpay_test'
    });
  } catch (err) {
    await t.rollback();
    console.error('createOrder error:', err);
    return res.status(500).json({ success: false, message: 'Could not create payment order.' });
  }
};

// POST /api/payments/verify
const verifyPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registration_id } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('your_razorpay')) {
      await t.rollback();
      return res.status(503).json({ success: false, message: 'Razorpay Test Mode is not configured.' });
    }
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id).digest();
    const received = Buffer.from(String(razorpay_signature || ''), 'hex');
    const validSignature = received.length === expected.length && crypto.timingSafeEqual(expected, received);

    if (!validSignature) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const payment = await Payment.findOne({
      where: { gateway_order_id: razorpay_order_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!payment) { await t.rollback(); return res.status(404).json({ success: false, message: 'Payment record not found.' }); }
    if (Number(payment.registration_id) !== Number(registration_id)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Payment order does not match this registration.' });
    }
    const reg = await EventRegistration.findByPk(registration_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!reg || Number(reg.user_id) !== Number(req.user.user_id)) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (payment.status === 'Completed') {
      const ticket = await EventTicket.findOne({ where: { registration_id }, transaction: t });
      if (!ticket || ticket.ticket_status !== 'Valid') {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'A valid Event Pass is not available for this payment.' });
      }
      const qr_code = await require('qrcode').toDataURL(createTicketQrToken(ticket));
      await t.commit();
      return res.json({ success: true, message: 'Payment already verified.', ticket_number: ticket.public_ticket_number, qr_code });
    }

    const isSimulatedOrder = razorpay_order_id && razorpay_order_id.startsWith('order_sim_');
    if (!isSimulatedOrder) {
      let gatewayPayment;
      try {
        gatewayPayment = await getRazorpay().payments.fetch(razorpay_payment_id);
      } catch (_) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Razorpay could not confirm this payment.' });
      }
      const expectedAmount = Math.round(Number(payment.amount) * 100);
      if (gatewayPayment.order_id !== razorpay_order_id || gatewayPayment.status !== 'captured' ||
          Number(gatewayPayment.amount) !== expectedAmount || gatewayPayment.currency !== payment.currency) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Payment is not captured for the expected amount and order.' });
      }
    }

    // Update payment to Completed
    payment.gateway_payment_id = razorpay_payment_id;
    payment.status = 'Completed';
    payment.paid_at = new Date();
    await payment.save({ transaction: t });

    // Confirm registration
    if (reg.registration_status === 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'This registration was cancelled.' });
    }
    reg.registration_status = 'Confirmed';
    await reg.save({ transaction: t });

    // Issue cryptographic ticket
    const ticketData = await issueTicket(registration_id, t);
    await t.commit();

    const ev = await Event.findByPk(reg.event_id);
    await notificationService.notify(
      reg.user_id, 'payment_success', 'Payment Confirmed! 🎉',
      `Payment successful for "${ev ? ev.title : 'event'}". Your Event Pass is ready!`,
      reg.event_id
    );

    return res.json({
      success: true,
      message: 'Payment verified and ticket issued!',
      ticket_number: ticketData.ticket.public_ticket_number,
      qr_code: ticketData.qrDataUrl,
    });
  } catch (err) {
    await t.rollback();
    console.error('verifyPayment error:', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};

// POST /api/payments/webhook  (Razorpay server-to-server webhook)
const webhook = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const sig = req.headers['x-razorpay-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    if (!process.env.RAZORPAY_KEY_SECRET || !sig) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(rawBody).digest();
    const received = Buffer.from(String(sig), 'hex');

    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    if (payload.event === 'payment.captured') {
      const gatewayPayment = payload.payload?.payment?.entity;
      if (!gatewayPayment?.order_id || !gatewayPayment?.id) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Webhook payment details are incomplete.' });
      }
      const payment = await Payment.findOne({
        where: { gateway_order_id: gatewayPayment.order_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!payment) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Payment order not found.' });
      }
      if (Number(gatewayPayment.amount) !== Math.round(Number(payment.amount) * 100) ||
          gatewayPayment.currency !== payment.currency) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Captured payment amount does not match the order.' });
      }
      if (payment.status !== 'Completed') {
        const reg = await EventRegistration.findByPk(payment.registration_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!reg || reg.registration_status === 'Cancelled') {
          await t.rollback();
          return res.status(409).json({ success: false, message: 'Registration is no longer active.' });
        }
        payment.gateway_payment_id = gatewayPayment.id;
        payment.status = 'Completed';
        payment.paid_at = new Date();
        await payment.save({ transaction: t });
        reg.registration_status = 'Confirmed';
        await reg.save({ transaction: t });
        await issueTicket(reg.registration_id, t);
        await t.commit();
        await notificationService.notify(reg.user_id, 'payment_success', 'Payment Confirmed!',
          'Your payment was captured and your Event Pass is ready.', reg.event_id);
        return res.json({ success: true });
      }
    }
    await t.commit();
    return res.json({ success: true });
  } catch (err) {
    if (!t.finished) await t.rollback();
    console.error('webhook error:', err);
    return res.status(500).json({ success: false });
  }
};

// Stub helper referenced in registrationController
const issueTicket = async (registration_id, t) => {
  const crypto = require('crypto');
  const QRCode = require('qrcode');

  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  const ticketNumber = `MTR-${date}-${rand}`;
  let ticket = await EventTicket.findOne({ where: { registration_id }, transaction: t });
  const priorIssuedAt = ticket?.issued_at ? new Date(ticket.issued_at).getTime() : 0;
  const issuedAt = new Date(Math.max(Date.now(), priorIssuedAt + 1000));
  if (ticket) {
    ticket.public_ticket_number = ticketNumber;
    ticket.qr_token_hash = crypto.randomBytes(32).toString('hex');
    ticket.ticket_status = 'Valid';
    ticket.issued_at = issuedAt;
    await ticket.save({ transaction: t });
  } else {
    ticket = await EventTicket.create({
      registration_id,
      public_ticket_number: ticketNumber,
      qr_token_hash: crypto.randomBytes(32).toString('hex'),
      ticket_status: 'Valid',
      issued_at: issuedAt,
    }, { transaction: t });
  }

  await ticket.reload({ transaction: t });
  const qrRaw = createTicketQrToken(ticket);
  ticket.qr_token_hash = require('../utils/ticketQr').hashQrToken(qrRaw);
  await ticket.save({ transaction: t });
  const qrDataUrl = await QRCode.toDataURL(qrRaw);
  return { ticket, qrDataUrl };
};

// GET /api/organizer/payments (Organizer Revenue & Payment Transactions)
const getOrganizerPayments = async (req, res) => {
  try {
    const { User } = require('../models');
    // Find all events owned by this organizer
    const myEvents = await Event.findAll({
      where: { organizer_id: req.user.user_id },
      attributes: ['event_id', 'title', 'price', 'currency']
    });

    const eventIds = myEvents.map(e => e.event_id);
    if (eventIds.length === 0) {
      return res.json({
        success: true,
        total_revenue: 0,
        total_refunded: 0,
        total_paid_bookings: 0,
        total_refunded_bookings: 0,
        total_free_passes: 0,
        total_attendees: 0,
        payments: []
      });
    }

    // Find all registrations for these events (both paid with Payments and free entries with tickets)
    const registrations = await EventRegistration.findAll({
      where: { event_id: eventIds },
      include: [
        { model: Event, as: 'event', attributes: ['event_id', 'title', 'price', 'currency'] },
        { model: User, as: 'user', attributes: ['user_id', 'name', 'email'] },
        { model: Payment, as: 'payment', required: false },
        { model: EventTicket, as: 'ticket', attributes: ['public_ticket_number', 'ticket_status'] }
      ],
      order: [['registered_at', 'DESC']]
    });

    let totalRevenue = 0;
    let totalRefunded = 0;
    let completedCount = 0;
    let refundedCount = 0;
    let freePassCount = 0;

    const paymentRecords = [];

    for (const reg of registrations) {
      const isEventFree = !reg.event || parseFloat(reg.event.price || 0) === 0;

      if (reg.payment) {
        if (!['Completed', 'Refunded'].includes(reg.payment.status)) {
          continue;
        }
        const amt = parseFloat(reg.payment.amount || 0);
        if (reg.payment.status === 'Completed') {
          totalRevenue += amt;
          completedCount++;
        } else if (reg.payment.status === 'Refunded') {
          totalRefunded += amt;
          refundedCount++;
        }

        paymentRecords.push({
          payment_id: reg.payment.payment_id,
          registration_id: reg.registration_id,
          amount: amt,
          currency: reg.payment.currency || 'INR',
          gateway: reg.payment.gateway,
          gateway_payment_id: reg.payment.gateway_payment_id,
          gateway_order_id: reg.payment.gateway_order_id,
          status: reg.payment.status,
          is_free: false,
          paid_at: reg.payment.paid_at || reg.registered_at,
          event_id: reg.event?.event_id,
          event_title: reg.event?.title || 'Meetior Event',
          attendee_name: reg.user?.name || 'Attendee',
          attendee_email: reg.user?.email || '',
          ticket_number: reg.ticket?.public_ticket_number || 'Pass Ready'
        });
      } else if (isEventFree) {
        // Free registration pass
        const isCancelled = (reg.registration_status === 'Cancelled');
        if (!isCancelled) {
          freePassCount++;
        }

        paymentRecords.push({
          payment_id: `FREE-${reg.registration_id}`,
          registration_id: reg.registration_id,
          amount: 0.00,
          currency: reg.event?.currency || 'INR',
          gateway: 'FREE_PASS',
          gateway_payment_id: 'FREE_ENTRY',
          gateway_order_id: `FREE_REG_${reg.registration_id}`,
          status: isCancelled ? 'Refunded' : 'Completed',
          is_free: true,
          paid_at: reg.registered_at,
          event_id: reg.event?.event_id,
          event_title: reg.event?.title || 'Meetior Free Event',
          attendee_name: reg.user?.name || 'Attendee',
          attendee_email: reg.user?.email || '',
          ticket_number: reg.ticket?.public_ticket_number || 'FREE-PASS'
        });
      }
    }

    // Sort descending by transaction / registration date
    paymentRecords.sort((a, b) => new Date(b.paid_at || 0) - new Date(a.paid_at || 0));

    const totalAttendees = completedCount + freePassCount;

    return res.json({
      success: true,
      total_revenue: totalRevenue,
      total_refunded: totalRefunded,
      total_paid_bookings: completedCount,
      total_refunded_bookings: refundedCount,
      total_free_passes: freePassCount,
      total_attendees: totalAttendees,
      payments: paymentRecords
    });
  } catch (err) {
    console.error('getOrganizerPayments error:', err);
    return res.status(500).json({ success: false, message: 'Could not load organizer payments: ' + err.message });
  }
};

// POST /api/payments/demo-wallet-pay
const demoWalletPay = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // DEMO-ONLY SAFEGUARD: Block demo simulated payments if running in strict production without demo flag
    const isDemoAllowed = process.env.ENABLE_DEMO_PAYMENTS !== 'false' && (process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true');
    if (!isDemoAllowed) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: 'Demo payments are only permitted in academic demonstration and testing mode.'
      });
    }
    const { registration_id, payment_mode } = req.body;
    if (!registration_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'registration_id is required.' });
    }

    const reg = await EventRegistration.findByPk(registration_id, {
      include: [{ model: Event, as: 'event' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!reg || Number(reg.user_id) !== Number(req.user.user_id)) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (reg.registration_status === 'Confirmed') {
      const ticket = await EventTicket.findOne({ where: { registration_id }, transaction: t });
      if (ticket && ticket.ticket_status === 'Valid') {
        const qr_code = await require('qrcode').toDataURL(createTicketQrToken(ticket));
        await t.commit();
        return res.json({
          success: true,
          message: 'Registration is already confirmed.',
          ticket_number: ticket.public_ticket_number,
          qr_code
        });
      }
    }

    const eventPrice = parseFloat(reg.event ? reg.event.price : 0) || 0;
    const mode = payment_mode || 'Demo Wallet';
    const simOrderId = 'order_wallet_' + crypto.randomBytes(8).toString('hex');
    const simPayId = 'pay_wallet_' + crypto.randomBytes(8).toString('hex');

    // Create or update payment record in MySQL
    let payment = await Payment.findOne({ where: { registration_id }, transaction: t, lock: t.LOCK.UPDATE });
    if (payment) {
      payment.gateway = 'demo_wallet';
      payment.gateway_order_id = simOrderId;
      payment.gateway_payment_id = simPayId;
      payment.amount = eventPrice;
      payment.currency = reg.event?.currency || 'INR';
      payment.status = 'Completed';
      payment.payment_mode = mode;
      payment.paid_at = new Date();
      await payment.save({ transaction: t });
    } else {
      payment = await Payment.create({
        registration_id,
        gateway: 'demo_wallet',
        gateway_order_id: simOrderId,
        gateway_payment_id: simPayId,
        amount: eventPrice,
        currency: reg.event?.currency || 'INR',
        status: 'Completed',
        payment_mode: mode,
        paid_at: new Date(),
      }, { transaction: t });
    }

    // Confirm registration
    reg.registration_status = 'Confirmed';
    await reg.save({ transaction: t });

    // Issue cryptographic ticket
    const ticketData = await issueTicket(registration_id, t);
    await t.commit();

    const ev = await Event.findByPk(reg.event_id);
    await notificationService.notify(
      reg.user_id, 'payment_success', 'Payment Confirmed! 🎉',
      `Payment successful via ${mode} for "${ev ? ev.title : 'event'}". Your Event Pass is ready!`,
      reg.event_id
    );

    return res.json({
      success: true,
      message: `Payment verified via ${mode}! Event pass issued.`,
      ticket_number: ticketData.ticket.public_ticket_number,
      qr_code: ticketData.qrDataUrl,
      payment_id: payment.payment_id
    });
  } catch (err) {
    await t.rollback();
    console.error('demoWalletPay error:', err);
    return res.status(500).json({ success: false, message: 'Demo payment failed: ' + err.message });
  }
};

// GET /api/payments/upi-qr
const getUpiQr = async (req, res) => {
  try {
    const QRCode = require('qrcode');
    const amount = parseFloat(req.query.amount || 0).toFixed(2);
    const regId = req.query.reg_id || '0';
    const cleanUpiId = (req.query.upi_id || 'meetior.events@okhdfcbank').trim();
    const upiUri = `upi://pay?pa=${cleanUpiId}&pn=Meetior%20Events&am=${amount}&cu=INR&tn=Meetior%20Pass%20${regId}`;
    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      width: 260,
      margin: 1,
      color: { dark: '#0b2545', light: '#ffffff' }
    });
    return res.json({
      success: true,
      qr_code: qrDataUrl,
      upi_id: cleanUpiId,
      upi_uri: upiUri,
      amount
    });
  } catch (err) {
    console.error('getUpiQr error:', err);
    return res.status(500).json({ success: false, message: 'Could not generate UPI QR code.' });
  }
};

module.exports = { createOrder, verifyPayment, webhook, getOrganizerPayments, demoWalletPay, getUpiQr };
