'use strict';

const axios = require('axios');
const { Event } = require('../models');
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5000';

async function runSuratLifecycleTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Meetior Surat Discovery & Event Lifecycle Test');
  console.log('🧪 ========================================================\n');

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

  // 1. Verify All-India Location MySQL Database
  console.log('📍 Phase 3: Verifying All-India Location Reference Dataset...');
  try {
    const statesRes = await axios.get(`${BASE_URL}/api/locations/states`);
    assert(statesRes.data.success && statesRes.data.states.length >= 36, `States endpoint returned ${statesRes.data.states.length} States & UTs (All 28 States + 8 UTs)`);

    const districtsRes = await axios.get(`${BASE_URL}/api/locations/districts?state_name=Gujarat`);
    assert(districtsRes.data.success && districtsRes.data.districts.some(d => d.district_name === 'Gandhinagar'), 'Districts endpoint returns Gandhinagar under Gujarat');
    assert(districtsRes.data.districts.some(d => d.district_name === 'Surat'), 'Districts endpoint returns Surat under Gujarat');

    const citiesRes = await axios.get(`${BASE_URL}/api/locations/cities?district_name=Gandhinagar`);
    assert(citiesRes.data.success && citiesRes.data.cities.some(c => c.city_name === 'Koba'), 'Cities endpoint includes Koba under Gandhinagar district');
    assert(citiesRes.data.cities.some(c => c.city_name === 'Adalaj'), 'Cities endpoint includes Adalaj under Gandhinagar district');

    const pinRes = await axios.get(`${BASE_URL}/api/locations/pincode/382007`);
    assert(
      pinRes.data.success &&
      pinRes.data.postal_code.district === 'Gandhinagar' &&
      pinRes.data.postal_code.state === 'Gujarat',
      'PIN code 382007 correctly maps to Gandhinagar, Gujarat'
    );
  } catch (err) {
    assert(false, `Location dataset check failed: ${err.message}`);
  }

  // 2. Register Organizer with Profile City: Mumbai
  console.log('\n👤 Phase 8: Testing Cross-City Event Discovery (Mumbai Organizer -> Surat Event)...');
  let orgToken = '';
  const ts = Date.now();
  const orgEmail = `mumbai_org_${ts}@meetior.in`;
  try {
    const orgRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Rohan Mehta (Mumbai)',
      email: orgEmail,
      password: 'Meetior2026',
      role: 'Organizer',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pincode: '400050'
    });
    orgToken = orgRes.data.token;
    assert(orgRes.data.success && orgRes.data.user.city === 'Mumbai', `Registered Organizer with profile city: ${orgRes.data.user.city}`);
  } catch (err) {
    assert(false, `Organizer registration failed: ${err.message}`);
  }

  // 3. Organizer creates an event with venue in Surat, Gujarat
  let suratEventId = null;
  const suratTitle = `Surat Sunset Photography Meetup ${ts}`;
  try {
    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);   // +3 hours

    const evRes = await axios.post(`${BASE_URL}/api/events`, {
      title: suratTitle,
      description: 'Golden hour street and beach photography workshop in Surat along Dumas Road.',
      category_id: 2, // Arts & Culture / Photography
      venue_name: 'Dumas Beach Road Promenade',
      address: 'Near Old Dumas Sultanate Gate, Dumas Beach',
      city: 'Surat',
      district: 'Surat',
      state: 'Gujarat',
      postal_code: '395007',
      discovery_city: 'Surat',
      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),
      total_seats: 40,
      price: 0,
      tags: ['photography', 'surat', 'workshop']
    }, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });

    suratEventId = evRes.data.event.event_id;
    assert(
      evRes.data.success &&
      evRes.data.event.city === 'Surat' &&
      evRes.data.event.district === 'Surat' &&
      evRes.data.event.state === 'Gujarat',
      `Event created with independent venue location: Surat, Gujarat (Organizer is Mumbai-based)`
    );
  } catch (err) {
    assert(false, `Surat event creation failed: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
  }

  // 4. Register Attendee with Profile City: Mumbai
  let attendeeToken = '';
  const attendeeEmail = `mumbai_attendee_${ts}@meetior.in`;
  try {
    const attRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Aarav Patel (Mumbai)',
      email: attendeeEmail,
      password: 'Meetior2026',
      role: 'Attendee',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pincode: '400050'
    });
    attendeeToken = attRes.data.token;
    assert(attRes.data.success && attRes.data.user.city === 'Mumbai', `Registered Attendee with profile city: ${attRes.data.user.city}`);
  } catch (err) {
    assert(false, `Attendee registration failed: ${err.message}`);
  }

  // 5. Verify Surat event does NOT appear in Mumbai event feed
  try {
    const mumbaiRes = await axios.get(`${BASE_URL}/api/events?city=Mumbai`);
    const foundInMumbai = mumbaiRes.data.events.some(e => e.event_id === suratEventId);
    assert(!foundInMumbai, 'Surat event does NOT appear when browsing Mumbai events (Proper venue isolation)');
  } catch (err) {
    assert(false, `Mumbai browsing query failed: ${err.message}`);
  }

  // 6. Verify Surat event DOES appear when attendee switches browsing city to Surat
  try {
    const suratRes = await axios.get(`${BASE_URL}/api/events?city=Surat`);
    const foundInSurat = suratRes.data.events.some(e => e.event_id === suratEventId);
    assert(foundInSurat, 'Surat event DOES appear when browsing city is changed to Surat');
  } catch (err) {
    assert(false, `Surat browsing query failed: ${err.message}`);
  }

  // 7. Verify Surat event DOES appear when browsing All India (city=all or omitted)
  try {
    const allRes = await axios.get(`${BASE_URL}/api/events?city=all&limit=50`);
    const foundInAll = allRes.data.events.some(e => e.event_id === suratEventId);
    assert(foundInAll, 'Surat event DOES appear when browsing All India (city=all)');
  } catch (err) {
    assert(false, `All-India browsing query failed: ${err.message}`);
  }

  // 8. Phase 13: Event Lifecycle & Inactive Event Handling
  console.log('\n⏳ Phase 13: Testing Event Lifecycle & Inactive Event Handling...');
  let pastEventId = null;
  try {
    // Create an event that ended 2 hours ago
    const pastStart = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hrs ago
    const pastEnd = new Date(Date.now() - 2 * 60 * 60 * 1000);   // 2 hrs ago

    const pastEvRes = await axios.post(`${BASE_URL}/api/events`, {
      title: `Past Retrospective Meetup ${ts}`,
      description: 'A completed meetup to verify event lifecycle status transition.',
      category_id: 1,
      venue_name: 'Heritage Hall',
      city: 'Surat',
      district: 'Surat',
      state: 'Gujarat',
      postal_code: '395007',
      start_datetime: pastStart.toISOString(),
      end_datetime: pastEnd.toISOString(),
      total_seats: 25,
      price: 0
    }, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    pastEventId = pastEvRes.data.event.event_id;

    // Trigger status reconciliation via event details fetch
    const detailRes = await axios.get(`${BASE_URL}/api/events/${pastEventId}`);
    assert(
      detailRes.data.success && detailRes.data.event.status === 'Completed',
      `Event whose end_datetime has passed auto-transitions to status: "${detailRes.data.event.status}"`
    );
  } catch (err) {
    assert(false, `Past event setup failed: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
  }

  // 9. Verify Registration is blocked on ended/completed event
  if (pastEventId) {
    try {
      await axios.post(`${BASE_URL}/api/events/${pastEventId}/register`, {}, {
        headers: { Authorization: `Bearer ${attendeeToken}` }
      });
      assert(false, 'Registration succeeded on ended event (SHOULD BE REJECTED)');
    } catch (err) {
      const isBlocked = err.response?.status === 400 && (
        err.response?.data?.message?.toLowerCase().includes('ended') ||
        err.response?.data?.message?.toLowerCase().includes('completed')
      );
      assert(isBlocked, `Registration properly blocked on ended event: "${err.response?.data?.message}"`);
    }

    // 10. Verify QR Check-in is blocked on ended/completed event
    try {
      const checkinRes = await axios.post(`${BASE_URL}/api/organizer/events/${pastEventId}/check-in`, {
        qr_token: 'dummy_token'
      }, {
        headers: { Authorization: `Bearer ${orgToken}` },
        validateStatus: () => true
      });
      const checkinBlocked = checkinRes.status === 400 && (
        checkinRes.data.result === 'EVENT_ENDED' ||
        checkinRes.data.message?.toLowerCase().includes('ended')
      );
      assert(checkinBlocked, `Check-in scanner properly rejects check-ins on ended event: "${checkinRes.data.message}"`);
    } catch (err) {
      assert(false, `Check-in test failed with error: ${err.message}`);
    }

    // Clean up created test events
    try {
      await Event.destroy({ where: { event_id: [suratEventId, pastEventId] } });
    } catch (_) {}
  }

  console.log('\n========================================================');
  console.log(`🏁 Surat & Lifecycle Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  return { passed, failed };
}

module.exports = runSuratLifecycleTests;

if (require.main === module) {
  runSuratLifecycleTests().then(res => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  }).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
