if (!/^meetior_test_\d+_\d+$/.test(process.env.DB_NAME || '')) throw new Error('Run npm test: this suite requires a disposable test database.');
'use strict';

const axios = require('axios');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 Starting Meetior Automated API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check
  try {
    const res = await axios.get(`${BASE_URL}/api/health`);
    assert(res.data.status === 'ok' && res.data.database === 'Connected', 'Server health check returns ok and MySQL connected');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. Categories
  try {
    const res = await axios.get(`${BASE_URL}/api/categories`);
    assert(res.data.success && res.data.categories.length >= 8, `Categories endpoint returned ${res.data.categories.length} categories`);
  } catch (err) {
    assert(false, `Categories check failed: ${err.message}`);
  }

  // 3. Organizer Login
  let orgToken = '';
  let orgUser = null;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'organizer@meetior.in',
      password: 'Meetior2026'
    });
    orgToken = res.data.token;
    orgUser = res.data.user;
    assert(res.data.success && res.data.user.role === 'Organizer', 'Organizer login succeeds with role Organizer');
  } catch (err) {
    assert(false, `Organizer login failed: ${err.message}`);
  }

  // 4. Attendee Login
  let attendeeToken = '';
  let attendeeUser = null;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'attendee@meetior.in',
      password: 'Meetior2026'
    });
    attendeeToken = res.data.token;
    attendeeUser = res.data.user;
    assert(res.data.success && res.data.user.role === 'Attendee', 'Attendee login succeeds with role Attendee');
  } catch (err) {
    assert(false, `Attendee login failed: ${err.message}`);
  }

  // 5. Auth verification /api/auth/me
  try {
    const res = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    assert(res.data.success && res.data.user.name === 'Nevil Sagpariya', '/api/auth/me returns authenticated attendee profile');
  } catch (err) {
    assert(false, `Auth me check failed: ${err.message}`);
  }

  // 6. Events discovery
  let firstEventId = 1;
  try {
    const res = await axios.get(`${BASE_URL}/api/events?city=Ahmedabad`);
    assert(res.data.success && res.data.events.length > 0, `Discovery returned ${res.data.events.length} events for Ahmedabad`);
    if (res.data.events.length > 0) {
      firstEventId = res.data.events[0].event_id;
    }
  } catch (err) {
    assert(false, `Events discovery failed: ${err.message}`);
  }

  // 7. Event Details
  try {
    const res = await axios.get(`${BASE_URL}/api/events/${firstEventId}`, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    assert(res.data.success && res.data.event.title.length > 0, `Event details returned title: "${res.data.event.title}"`);
  } catch (err) {
    assert(false, `Event details check failed: ${err.message}`);
  }

  // 8. Koba Administrative District Verification (Koba -> Gandhinagar)
  try {
    const res = await axios.get(`${BASE_URL}/api/locations/resolve?q=Koba`);
    assert(
      res.data.success &&
      res.data.resolved.district === 'Gandhinagar' &&
      res.data.resolved.discovery_city === 'Gandhinagar',
      'Location system correctly classifies Koba under Gandhinagar district (not Ahmedabad)'
    );
  } catch (err) {
    assert(false, `Koba resolution check failed: ${err.message}`);
  }

  // 9. Event Interaction (Going & Save)
  try {
    const resGoing = await axios.put(`${BASE_URL}/api/events/${firstEventId}/going`, {}, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    assert(resGoing.data.success, 'Attendee can mark event as Going');

    const resSave = await axios.put(`${BASE_URL}/api/events/${firstEventId}/save`, {}, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    assert(resSave.data.success, 'Attendee can save/bookmark event');
  } catch (err) {
    assert(false, `Interactions failed: ${err.message}`);
  }

  // 10. Free Event Registration & Digital Event Pass Generation
  let issuedTicketNo = '';
  try {
    const res = await axios.post(`${BASE_URL}/api/events/${firstEventId}/register`, {}, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    assert(res.data.success && res.data.ticket_number && res.data.qr_code, `Registration confirmed with Ticket: ${res.data.ticket_number} and QR data URL`);
    issuedTicketNo = res.data.ticket_number;
  } catch (err) {
    if (err.response?.data?.message?.includes('already registered')) {
      assert(true, 'Registration idempotency check: already registered attendee handled safely');
    } else {
      assert(false, `Registration failed: ${err.message}`);
    }
  }

  // 11. My Bookings
  try {
    const res = await axios.get(`${BASE_URL}/api/users/me/bookings`, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    assert(res.data.success && res.data.bookings.length > 0, `My Bookings returned ${res.data.bookings.length} confirmed reservations`);
  } catch (err) {
    assert(false, `Bookings check failed: ${err.message}`);
  }

  // 12. Community Demand Engine (Post Demand & Vote Support)
  let createdDemandId = 1;
  try {
    const testTitle = 'Test Pottery Workshop ' + Date.now();
    const res = await axios.post(`${BASE_URL}/api/demands`, {
      title: testTitle,
      category_id: 3,
      city: 'Ahmedabad',
      preferred_location: 'Vastrapur Lake',
      description: 'Hands-on pottery and ceramics for beginners'
    }, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    assert(res.data.success && res.data.demand.demand_id, `Community demand created: "${testTitle}"`);
    createdDemandId = res.data.demand.demand_id;

    // Upvote / Support
    const resSupport = await axios.post(`${BASE_URL}/api/demands/${createdDemandId}/support`, {}, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    assert(resSupport.data.success, 'Second user can upvote and support community demand');

    // Clean up created test demand
    const { EventDemand, DemandSupporter } = require('../models');
    await DemandSupporter.destroy({ where: { demand_id: createdDemandId } });
    await EventDemand.destroy({ where: { demand_id: createdDemandId } });
  } catch (err) {
    assert(false, `Demand engine failed: ${err.message}`);
  }

  // 13. Organizer Pass Verification Check-In
  try {
    const { Event } = require('../models');
    const myEvent = orgUser?.user_id ? await Event.findOne({ where: { organizer_id: orgUser.user_id } }) : null;
    if (myEvent) {
      const res = await axios.post(`${BASE_URL}/api/organizer/events/${myEvent.event_id}/check-in`, {
        qr_token: 'fake_invalid_token_12345'
      }, {
        headers: { Authorization: `Bearer ${orgToken}` },
        validateStatus: () => true
      });
      assert(res.status === 404 && res.data.result === 'INVALID_TICKET', 'Scanner rejects invalid or fake QR tokens');
    } else {
      assert(false, 'No organized event found for check-in test');
    }
  } catch (err) {
    assert(false, `Scanner check failed: ${err.message}`);
  }

  // 14. Notifications check
  try {
    const res = await axios.get(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    assert(res.data.success && Array.isArray(res.data.notifications), `In-app notifications loaded (${res.data.notifications.length} alerts)`);
  } catch (err) {
    assert(false, `Notifications check failed: ${err.message}`);
  }

  // 15. Payment Gateway (Razorpay Test Mode Order & Verification)
  try {
    // Create a fresh attendee to test new paid registration & payment flow
    const payUserEmail = `pay_user_${Date.now()}@meetior.in`;
    const regUserRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Payee',
      email: payUserEmail,
      password: 'Meetior2026',
      city: 'Ahmedabad',
      role: 'Attendee'
    });
    const payUserToken = regUserRes.data.token;

    const eventsRes = await axios.get(`${BASE_URL}/api/events?city=Ahmedabad`);
    const paidEv = eventsRes.data.events.find(e => parseFloat(e.price) > 0);
    if (paidEv) {
      const regRes = await axios.post(`${BASE_URL}/api/events/${paidEv.event_id}/register`, {}, {
        headers: { Authorization: `Bearer ${payUserToken}` }
      });
      assert(regRes.data.requires_payment, `Paid event registration returned status: requires_payment`);
      const regId = regRes.data.registration_id;

      const orderRes = await axios.post(`${BASE_URL}/api/payments/create-order`, {
        registration_id: regId
      }, {
        headers: { Authorization: `Bearer ${payUserToken}` }
      });
      assert(orderRes.data.success && orderRes.data.order_id, `Razorpay test order generated: ${orderRes.data.order_id}`);

      const verifyRes = await axios.post(`${BASE_URL}/api/payments/verify`, {
        registration_id: regId,
        razorpay_order_id: orderRes.data.order_id,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'test_signature_meetior'
      }, {
        headers: { Authorization: `Bearer ${payUserToken}` }
      });
      assert(verifyRes.data.success && verifyRes.data.ticket_number, `Payment verified and ticket generated: ${verifyRes.data.ticket_number}`);
    } else {
      assert(true, 'No paid events available to test payment');
    }
  } catch (err) {
    assert(false, `Payment gateway failed: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  return { passed, failed };
}

module.exports = runTests;

if (require.main === module) {
  runTests().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  }).catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
