if (!/^meetior_test_\d+_\d+$/.test(process.env.DB_NAME || '')) throw new Error('Run npm test: this suite requires a disposable test database.');
const axios = require('axios');
const { User, Event, EventRegistration, EventTicket, Payment, Location, Category, sequelize } = require('../models');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Cancellation Policy & Organizer Revenue Hub Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Log in organizer and attendee
    const orgRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'organizer@meetior.in',
      password: 'Meetior2026'
    });
    const orgToken = orgRes.data.token;
    const orgUser = orgRes.data.user;
    assert(orgToken && orgUser.role === 'Organizer', 'Organizer logged in successfully');

    const attRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'attendee@meetior.in',
      password: 'Meetior2026'
    });
    const attToken = attRes.data.token;
    const attUser = attRes.data.user;
    assert(attToken && attUser.role === 'Attendee', 'Attendee logged in successfully');

    // 2. Test Organizer Revenue endpoint
    const revRes = await axios.get(`${BASE_URL}/organizer/payments`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    assert(revRes.data.success === true, 'Organizer payments endpoint returns success: true');
    assert(typeof revRes.data.total_revenue === 'number', `Total revenue computed: ₹${revRes.data.total_revenue}`);
    assert(typeof revRes.data.total_refunded === 'number', `Total refunded computed: ₹${revRes.data.total_refunded}`);
    assert(Array.isArray(revRes.data.payments), `Payments list returned (${revRes.data.payments.length} transactions)`);

    // 3. Test Cancellation Policy
    // Case A: Event in the past / already started
    const pastEvent = await Event.create({
      organizer_id: orgUser.user_id,
      category_id: 1,
      location_id: 1,
      title: 'Past Test Event ' + Date.now(),
      description: 'Test cancellation on past event',
      start_datetime: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
      end_datetime: new Date(Date.now() - 1 * 3600 * 1000),   // 1 hour ago
      registration_deadline: new Date(Date.now() - 3 * 3600 * 1000),
      capacity: 50,
      price: 0.00,
      status: 'Completed',
      moderation_status: 'Approved'
    });

    const pastReg = await EventRegistration.create({
      user_id: attUser.user_id,
      event_id: pastEvent.event_id,
      registration_status: 'Confirmed'
    });

    try {
      await axios.delete(`${BASE_URL}/events/${pastEvent.event_id}/registration`, {
        headers: { Authorization: `Bearer ${attToken}` }
      });
      assert(false, 'Should have blocked cancellation for past event');
    } catch (err) {
      assert(
        err.response && err.response.status === 400 && err.response.data.code === 'EVENT_ALREADY_STARTED',
        'Blocked cancellation for past event with code EVENT_ALREADY_STARTED'
      );
    }

    // Clean up past test registration & event
    await EventRegistration.destroy({ where: { registration_id: pastReg.registration_id } });
    await Event.destroy({ where: { event_id: pastEvent.event_id } });

    // Case B: Event starting in < 24 hours (e.g. 5 hours from now)
    const soonEvent = await Event.create({
      organizer_id: orgUser.user_id,
      category_id: 1,
      location_id: 1,
      title: 'Starting Soon Test Event ' + Date.now(),
      description: 'Test cancellation within 24h cutoff',
      start_datetime: new Date(Date.now() + 5 * 3600 * 1000), // 5 hours from now
      end_datetime: new Date(Date.now() + 8 * 3600 * 1000),
      registration_deadline: new Date(Date.now() + 4 * 3600 * 1000),
      capacity: 50,
      price: 0.00,
      status: 'Published',
      moderation_status: 'Approved'
    });

    const soonReg = await EventRegistration.create({
      user_id: attUser.user_id,
      event_id: soonEvent.event_id,
      registration_status: 'Confirmed'
    });

    try {
      await axios.delete(`${BASE_URL}/events/${soonEvent.event_id}/registration`, {
        headers: { Authorization: `Bearer ${attToken}` }
      });
      assert(false, 'Should have blocked cancellation within 24 hours');
    } catch (err) {
      assert(
        err.response && err.response.status === 400 && err.response.data.code === 'CANCELLATION_DEADLINE_PASSED',
        'Blocked cancellation within 24 hours with code CANCELLATION_DEADLINE_PASSED'
      );
    }

    // Clean up soon test registration & event
    await EventRegistration.destroy({ where: { registration_id: soonReg.registration_id } });
    await Event.destroy({ where: { event_id: soonEvent.event_id } });

    // Clean any previous test leftovers first
    const { Op } = require('sequelize');
    const oldTestEvents = await Event.findAll({ where: { title: { [Op.like]: 'Future Paid Concert%' } } });
    for (const te of oldTestEvents) {
      const teRegs = await EventRegistration.findAll({ where: { event_id: te.event_id } });
      for (const r of teRegs) {
        await EventTicket.destroy({ where: { registration_id: r.registration_id } });
        await Payment.destroy({ where: { registration_id: r.registration_id } });
        await r.destroy();
      }
      await te.destroy();
    }

    // Case C: Event > 24 hours away (e.g. 3 days from now) - should succeed and process refund
    const futureEvent = await Event.create({
      organizer_id: orgUser.user_id,
      category_id: 1,
      location_id: 1,
      title: 'Future Paid Concert ' + Date.now(),
      description: 'Test cancellation > 24h away with refund',
      start_datetime: new Date(Date.now() + 72 * 3600 * 1000), // 3 days away
      end_datetime: new Date(Date.now() + 75 * 3600 * 1000),
      registration_deadline: new Date(Date.now() + 70 * 3600 * 1000),
      capacity: 50,
      price: 499.00,
      status: 'Published',
      moderation_status: 'Approved'
    });

    const futureReg = await EventRegistration.create({
      user_id: attUser.user_id,
      event_id: futureEvent.event_id,
      registration_status: 'Confirmed'
    });

    const payment = await Payment.create({
      registration_id: futureReg.registration_id,
      razorpay_order_id: 'order_test_future_' + Date.now(),
      razorpay_payment_id: 'pay_test_future_' + Date.now(),
      amount: 499.00,
      currency: 'INR',
      status: 'Completed',
      paid_at: new Date()
    });

    const crypto = require('crypto');
    const qrTokenStr = 'token_future_' + Date.now();
    const ticket = await EventTicket.create({
      registration_id: futureReg.registration_id,
      public_ticket_number: 'MTR-TEST-FUTURE',
      qr_token_hash: crypto.createHash('sha256').update(qrTokenStr).digest('hex'),
      ticket_status: 'Valid'
    });

    // Now cancel the registration
    const cancelRes = await axios.delete(`${BASE_URL}/events/${futureEvent.event_id}/registration`, {
      headers: { Authorization: `Bearer ${attToken}` }
    });

    assert(cancelRes.data.success === true, 'Successfully cancelled booking > 24h away');
    assert(cancelRes.data.refund && cancelRes.data.refund.amount == 499.00, 'Automated 100% refund initiated for ₹499.00');

    // Verify DB state
    const updatedReg = await EventRegistration.findByPk(futureReg.registration_id);
    const updatedPayment = await Payment.findByPk(payment.payment_id);
    const updatedTicket = await EventTicket.findByPk(ticket.ticket_id);

    assert(updatedReg.registration_status === 'Cancelled', 'Registration status is Cancelled in DB');
    assert(updatedPayment.status === 'Refunded', 'Payment status is Refunded in DB');
    assert(updatedTicket.ticket_status === 'Cancelled', 'Ticket status is Cancelled in DB');

    // Verify organizer revenue reflects the refunded payment
    const revAfterRefund = await axios.get(`${BASE_URL}/organizer/payments`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const refundedRecord = revAfterRefund.data.payments.find(p => p.payment_id === payment.payment_id);
    assert(refundedRecord && refundedRecord.status === 'Refunded', 'Payment appears in Organizer payments with status "Refunded"');

    // Clean up
    await EventTicket.destroy({ where: { ticket_id: ticket.ticket_id } });
    await Payment.destroy({ where: { payment_id: payment.payment_id } });
    await EventRegistration.destroy({ where: { registration_id: futureReg.registration_id } });
    await Event.destroy({ where: { event_id: futureEvent.event_id } });

  } catch (err) {
    console.error('Test execution failed:', err);
    failed++;
  }

  console.log('\n========================================');
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
