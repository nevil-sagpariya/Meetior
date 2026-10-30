'use strict';
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const {
  User, Event, EventRegistration, EventTicket, EventReview,
  EventCheckIn, Category, Notification, sequelize
} = require('../models');

async function runSyncIntegrationTests(customBaseUrl) {
  const BASE = customBaseUrl || 'http://localhost:5000';
  console.log(`\n========================================================`);
  console.log(`🔄 RUNNING BI-DIRECTIONAL SYNCHRONIZATION TEST SUITE`);
  console.log(`Target Base URL: ${BASE}`);
  console.log(`========================================================\n`);

  let passed = 0;
  let failed = 0;
  const createdUserIds = [];
  const createdEventIds = [];
  const createdCategoryIds = [];

  function assert(condition, message, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}${detail ? ' -> ' + detail : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Phase 0: Authenticate Admin & Baseline Overview
    // -------------------------------------------------------------------------
    console.log('[Phase 0] Admin Authentication & Baseline Overview');
    const adminLoginRes = await axios.post(`${BASE}/api/admin/auth/login`, {
      email: 'admin@meetior.in',
      password: 'Admin@123'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'Admin logged in successfully');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Baseline metrics
    const baselineOverview = (await axios.get(`${BASE}/api/admin/overview`, adminHeaders)).data;
    const initialAttendeeCount = baselineOverview.stats?.users?.attendees ?? 0;
    const initialOrganizerCount = baselineOverview.stats?.users?.organizers ?? 0;
    const initialEventCount = baselineOverview.stats?.events?.total ?? 0;

    // -------------------------------------------------------------------------
    // Phase 1: Forward Sync - Attendee Lifecycle & Profile -> Admin System
    // -------------------------------------------------------------------------
    console.log('\n[Phase 1] Forward Sync: Attendee Registration & Profile -> Admin System');
    const syncAttendeeEmail = `sync_attendee_${Date.now()}@test.example`;
    const regAttendeeRes = await axios.post(`${BASE}/api/auth/register`, {
      name: 'Sync Test Attendee',
      email: syncAttendeeEmail,
      password: 'SyncPass2026!',
      role: 'Attendee',
      city: 'Ahmedabad',
      district: 'Ahmedabad',
      state: 'Gujarat'
    });
    assert(regAttendeeRes.status === 201 && regAttendeeRes.data.user?.user_id, 'Attendee registered in main platform');
    const attendeeUser = regAttendeeRes.data.user;
    const attendeeToken = regAttendeeRes.data.token;
    const attendeeHeaders = { headers: { Authorization: `Bearer ${attendeeToken}` } };
    createdUserIds.push(attendeeUser.user_id);

    // Verify Admin Overview Attendee count incremented
    const afterAttOverview = (await axios.get(`${BASE}/api/admin/overview`, adminHeaders)).data;
    assert(
      (afterAttOverview.stats?.users?.attendees ?? 0) === initialAttendeeCount + 1,
      `Admin overview attendee count incremented (+1: ${afterAttOverview.stats?.users?.attendees})`
    );

    // Verify Admin Attendees Table contains new Attendee with active status and city Ahmedabad
    const attendeesList = (await axios.get(`${BASE}/api/admin/attendees`, adminHeaders)).data;
    const foundAttendee = attendeesList.attendees?.find(a => a.user_id === attendeeUser.user_id);
    assert(foundAttendee !== undefined, 'New attendee appears in Admin Attendees table');
    assert(foundAttendee?.city === 'Ahmedabad', `Admin table reflects attendee city 'Ahmedabad'`);
    assert(foundAttendee?.account_status === 'active', 'Admin table reflects account_status: active');

    // Attendee updates profile city to Surat via Main Platform
    const updateProfileRes = await axios.put(`${BASE}/api/auth/profile`, {
      name: 'Sync Test Attendee Updated',
      city: 'Surat',
      district: 'Surat',
      state: 'Gujarat'
    }, attendeeHeaders);
    assert(updateProfileRes.status === 200, 'Attendee profile updated in main platform');

    // Verify Admin Attendees Table immediately reflects updated city 'Surat'
    const updatedAttendeesList = (await axios.get(`${BASE}/api/admin/attendees`, adminHeaders)).data;
    const refreshedAttendee = updatedAttendeesList.attendees?.find(a => a.user_id === attendeeUser.user_id);
    assert(refreshedAttendee?.city === 'Surat', `Admin attendees table dynamically updated city to 'Surat'`);
    assert(refreshedAttendee?.name === 'Sync Test Attendee Updated', 'Admin attendees table dynamically updated name');

    // -------------------------------------------------------------------------
    // Phase 2: Forward Sync - Organizer Lifecycle & Event Publishing -> Admin
    // -------------------------------------------------------------------------
    console.log('\n[Phase 2] Forward Sync: Organizer & Event Creation -> Admin System');
    const syncOrgEmail = `sync_org_${Date.now()}@test.example`;
    const regOrgRes = await axios.post(`${BASE}/api/auth/register`, {
      name: 'Sync Test Organizer',
      email: syncOrgEmail,
      password: 'SyncPass2026!',
      role: 'Organizer',
      city: 'Surat',
      district: 'Surat',
      state: 'Gujarat'
    });
    assert(regOrgRes.status === 201 && regOrgRes.data.user?.user_id, 'Organizer registered in main platform');
    const orgUser = regOrgRes.data.user;
    const orgToken = regOrgRes.data.token;
    const orgHeaders = { headers: { Authorization: `Bearer ${orgToken}` } };
    createdUserIds.push(orgUser.user_id);

    // Verify Admin Overview Organizer count incremented
    const afterOrgOverview = (await axios.get(`${BASE}/api/admin/overview`, adminHeaders)).data;
    assert(
      (afterOrgOverview.stats?.users?.organizers ?? 0) === initialOrganizerCount + 1,
      `Admin overview organizer count incremented (+1: ${afterOrgOverview.stats?.users?.organizers})`
    );

    // Verify Admin Organizers Table contains new Organizer
    const orgList = (await axios.get(`${BASE}/api/admin/organizers`, adminHeaders)).data;
    const foundOrg = orgList.organizers?.find(o => o.user_id === orgUser.user_id);
    assert(foundOrg !== undefined, 'New organizer appears in Admin Organizers table');
    assert(foundOrg?.city === 'Surat', `Admin table reflects organizer city 'Surat'`);

    // Organizer creates an Event in Main Platform
    const createEventRes = await axios.post(`${BASE}/api/events`, {
      title: 'Sync Integration Tech Gala ' + Date.now(),
      description: 'Comprehensive bi-directional sync test event',
      category_id: 1,
      venue_name: 'Surat Exhibition Centre',
      city: 'Surat',
      district: 'Surat',
      state: 'Gujarat',
      latitude: 21.1702,
      longitude: 72.8311,
      start_datetime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 52 * 3600 * 1000).toISOString(),
      capacity: 50,
      price: 0
    }, orgHeaders);
    assert(createEventRes.status === 201 && createEventRes.data.event?.event_id, 'Organizer created event in main platform');
    const testEvent = createEventRes.data.event;
    createdEventIds.push(testEvent.event_id);

    // Verify Admin Overview Event count incremented
    const afterEventOverview = (await axios.get(`${BASE}/api/admin/overview`, adminHeaders)).data;
    assert(
      (afterEventOverview.stats?.events?.total ?? 0) === initialEventCount + 1,
      `Admin overview event count incremented (+1: ${afterEventOverview.stats?.events?.total})`
    );

    // Verify Admin Events Table contains this event
    const adminEventsList = (await axios.get(`${BASE}/api/admin/events`, adminHeaders)).data;
    const foundAdminEvent = adminEventsList.events?.find(e => e.event_id === testEvent.event_id);
    assert(foundAdminEvent !== undefined, 'New event appears in Admin Events moderation table');
    assert(foundAdminEvent?.organizer_name === 'Sync Test Organizer', 'Admin event table shows correct organizer name');
    assert(foundAdminEvent?.city === 'Surat', 'Admin event table shows correct city Surat');

    // -------------------------------------------------------------------------
    // Phase 3: Forward Sync - Attendee Booking & Checkin -> Admin Attendance & Metrics
    // -------------------------------------------------------------------------
    console.log('\n[Phase 3] Forward Sync: Booking & Check-in -> Admin Attendance');
    // Attendee books a free pass
    const bookingRes = await axios.post(`${BASE}/api/events/${testEvent.event_id}/register`, {}, attendeeHeaders);
    assert(bookingRes.status === 201 && bookingRes.data.qr_code, 'Attendee booked pass with valid QR code');

    // Verify Admin Attendance table reflects confirmed booking
    const adminAttendance = (await axios.get(`${BASE}/api/admin/attendance`, adminHeaders)).data;
    const eventAttendance = adminAttendance.events?.find(e => e.event_id === testEvent.event_id);
    assert(eventAttendance !== undefined && eventAttendance.confirmed_bookings === 1, 'Admin attendance reports confirmed_bookings = 1');
    assert(eventAttendance?.valid_checkins === 0, 'Admin attendance reports valid_checkins = 0 prior to scan');

    // Organizer performs ticket checkin
    const regRecord = await EventRegistration.findOne({ where: { event_id: testEvent.event_id, user_id: attendeeUser.user_id } });
    const ticketRecord = await EventTicket.findOne({ where: { registration_id: regRecord.registration_id } });
    const { createTicketQrToken } = require('../utils/ticketQr');
    const qrToken = createTicketQrToken(ticketRecord);

    const checkinRes = await axios.post(`${BASE}/api/organizer/events/${testEvent.event_id}/check-in`, { qr_token: qrToken }, orgHeaders);
    assert(checkinRes.status === 200 && checkinRes.data.success === true, 'Organizer successfully checked in attendee');

    // Verify Admin Attendance table reflects valid checkin
    const refreshedAttendance = (await axios.get(`${BASE}/api/admin/attendance`, adminHeaders)).data;
    const updatedEventAtt = refreshedAttendance.events?.find(e => e.event_id === testEvent.event_id);
    assert(updatedEventAtt?.valid_checkins === 1, 'Admin attendance dynamically updated valid_checkins to 1');

    // Verify Admin Attendees list reflects attendee verified attendance
    const refreshedAtts = (await axios.get(`${BASE}/api/admin/attendees`, adminHeaders)).data;
    const attendedAttendee = refreshedAtts.attendees?.find(a => a.user_id === attendeeUser.user_id);
    assert(attendedAttendee?.total_confirmed_bookings === 1, 'Admin attendee record shows total_confirmed_bookings = 1');
    assert(attendedAttendee?.total_verified_attended === 1, 'Admin attendee record shows total_verified_attended = 1');

    // Checked-in attendee posts a review
    const reviewRes = await axios.post(`${BASE}/api/events/${testEvent.event_id}/reviews`, {
      rating: 5,
      comment: 'Superb event, seamlessly organized in Surat!'
    }, attendeeHeaders);
    assert(reviewRes.status === 201 && reviewRes.data.success === true, 'Checked-in attendee submitted event review');

    // Verify Admin Reviews management reflects new review
    const adminReviews = (await axios.get(`${BASE}/api/admin/reviews`, adminHeaders)).data;
    const foundReview = adminReviews.reviews?.find(r => r.event_id === testEvent.event_id && r.user_id === attendeeUser.user_id);
    assert(foundReview !== undefined, 'New review appears in Admin Reviews moderation panel');
    assert(foundReview?.rating === 5, 'Admin review panel displays accurate rating 5/5');

    // -------------------------------------------------------------------------
    // Phase 4: Reverse Sync - Admin Moderation -> Public Discovery Visibility
    // -------------------------------------------------------------------------
    console.log('\n[Phase 4] Reverse Sync: Admin Moderation -> Public Event Feeds');
    // Public feed contains event
    const publicDiscoveryBefore = (await axios.get(`${BASE}/api/events?city=Surat`)).data;
    assert(
      publicDiscoveryBefore.events?.some(e => e.event_id === testEvent.event_id),
      'Public event discovery feed contains newly created approved event'
    );

    // Admin HIDES the event
    const hideRes = await axios.patch(`${BASE}/api/admin/events/${testEvent.event_id}/moderate`, {
      moderation_status: 'Hidden',
      reason: 'Bi-directional test safety quarantine'
    }, adminHeaders);
    assert(hideRes.status === 200, 'Admin moderated event to Hidden');

    // Public feed MUST exclude hidden event
    const publicDiscoveryHidden = (await axios.get(`${BASE}/api/events?city=Surat`)).data;
    assert(
      !publicDiscoveryHidden.events?.some(e => e.event_id === testEvent.event_id),
      'Public event discovery feed IMMEDIATELY excludes hidden event'
    );

    // Admin RESTORES event to Approved
    const restoreRes = await axios.patch(`${BASE}/api/admin/events/${testEvent.event_id}/moderate`, {
      moderation_status: 'Approved',
      reason: 'Bi-directional test restore'
    }, adminHeaders);
    assert(restoreRes.status === 200, 'Admin moderated event back to Approved');

    // Public feed MUST include event again
    const publicDiscoveryRestored = (await axios.get(`${BASE}/api/events?city=Surat`)).data;
    assert(
      publicDiscoveryRestored.events?.some(e => e.event_id === testEvent.event_id),
      'Public event discovery feed IMMEDIATELY restores approved event'
    );

    // -------------------------------------------------------------------------
    // Phase 5: Reverse Sync - Admin User Moderation -> Main Project Login & Access
    // -------------------------------------------------------------------------
    console.log('\n[Phase 5] Reverse Sync: Admin User Suspension -> Main Project Login & Access');
    // Admin suspends Attendee
    const suspendAttRes = await axios.patch(`${BASE}/api/admin/users/${attendeeUser.user_id}/status`, {
      account_status: 'suspended',
      reason: 'Violation of platform community guidelines'
    }, adminHeaders);
    assert(suspendAttRes.status === 200, 'Admin suspended attendee account');

    // Attendee login attempt MUST fail with 403 Forbidden
    try {
      await axios.post(`${BASE}/api/auth/login`, {
        email: syncAttendeeEmail,
        password: 'SyncPass2026!'
      });
      assert(false, 'Suspended attendee login should be rejected');
    } catch (err) {
      assert(err.response?.status === 403, 'Suspended attendee login rejected with HTTP 403 Forbidden');
      assert(err.response?.data?.message?.includes('suspended'), 'Rejection message cites account suspension');
    }

    // Attendee authenticated request with existing token MUST also fail with 403
    try {
      await axios.get(`${BASE}/api/users/me/bookings`, attendeeHeaders);
      assert(false, 'Suspended attendee authenticated request should be rejected');
    } catch (err) {
      assert(err.response?.status === 403, 'Suspended attendee authenticated request rejected with HTTP 403 Forbidden');
    }

    // Admin reactivates Attendee
    const reactivateAttRes = await axios.patch(`${BASE}/api/admin/users/${attendeeUser.user_id}/status`, {
      account_status: 'active',
      reason: 'Appeal approved and account reinstated'
    }, adminHeaders);
    assert(reactivateAttRes.status === 200, 'Admin reactivated attendee account');

    // Attendee login attempt MUST succeed now
    const loginReactivatedRes = await axios.post(`${BASE}/api/auth/login`, {
      email: syncAttendeeEmail,
      password: 'SyncPass2026!'
    });
    assert(loginReactivatedRes.status === 200 && loginReactivatedRes.data.token, 'Reactivated attendee logged in successfully with HTTP 200');

    // -------------------------------------------------------------------------
    // Phase 6: Reverse Sync - Admin Platform Settings -> Booking Policy Enforcement
    // -------------------------------------------------------------------------
    console.log('\n[Phase 6] Reverse Sync: Admin Platform Settings -> Cancellation Cutoff Policy');
    // Set cancellation cutoff to 12 hours
    const updateSettingsRes = await axios.patch(`${BASE}/api/admin/settings`, {
      settings: { cancellation_cutoff_hours: '12' },
      reason: 'Test cancellation window change'
    }, adminHeaders);
    assert(updateSettingsRes.status === 200, 'Admin updated platform setting cancellation_cutoff_hours to 12');

    // Verify setting is returned by Admin Settings API
    const settingsList = (await axios.get(`${BASE}/api/admin/settings`, adminHeaders)).data;
    const cutoffVal = settingsList.settings_map?.cancellation_cutoff_hours || 
                      (Array.isArray(settingsList.settings) ? settingsList.settings.find(s => s.setting_key === 'cancellation_cutoff_hours')?.setting_value : settingsList.settings?.cancellation_cutoff_hours);
    assert(
      cutoffVal === '12',
      'Admin settings query returns updated cancellation_cutoff_hours: 12'
    );

    // Restore setting to 24 hours
    await axios.patch(`${BASE}/api/admin/settings`, {
      settings: { cancellation_cutoff_hours: '24' },
      reason: 'Restore standard 24h cutoff'
    }, adminHeaders);
    const restoredSettings = (await axios.get(`${BASE}/api/admin/settings`, adminHeaders)).data;
    const restoredVal = restoredSettings.settings_map?.cancellation_cutoff_hours || 
                        (Array.isArray(restoredSettings.settings) ? restoredSettings.settings.find(s => s.setting_key === 'cancellation_cutoff_hours')?.setting_value : restoredSettings.settings?.cancellation_cutoff_hours);
    assert(
      restoredVal === '24',
      'Admin settings restored to 24 hours'
    );

    // -------------------------------------------------------------------------
    // Phase 7: Reverse Sync - Admin Category Management -> Main App Public Categories
    // -------------------------------------------------------------------------
    console.log('\n[Phase 7] Reverse Sync: Admin Category Creation -> Main App Discovery');
    const testCategoryName = `Sync AI Expo ${Date.now()}`;
    const createCatRes = await axios.post(`${BASE}/api/admin/categories`, {
      name: testCategoryName,
      icon: '🤖',
      description: 'Artificial intelligence and automated robotics'
    }, adminHeaders);
    assert(createCatRes.status === 201 && createCatRes.data.category?.category_id, 'Admin created new category');
    const createdCat = createCatRes.data.category;
    createdCategoryIds.push(createdCat.category_id);

    // Public categories endpoint MUST contain newly created category
    const publicCats = (await axios.get(`${BASE}/api/categories`)).data;
    assert(
      publicCats.categories?.some(c => c.category_id === createdCat.category_id && c.name === testCategoryName),
      'Public categories API immediately reflects admin-created category'
    );

  } catch (err) {
    console.error('❌ Unexpected test error:', err.response?.data || err.message);
    failed++;
  } finally {
    console.log('\n🧹 Cleaning up test-generated records...');
    try {
      if (createdEventIds.length > 0) {
        const regs = await EventRegistration.findAll({ where: { event_id: createdEventIds }, attributes: ['registration_id'] });
        const regIds = regs.map(r => r.registration_id);
        if (regIds.length > 0) {
          await EventTicket.destroy({ where: { registration_id: regIds } });
          await EventCheckIn.destroy({ where: { event_id: createdEventIds } });
        }
        await EventReview.destroy({ where: { event_id: createdEventIds } });
        await EventRegistration.destroy({ where: { event_id: createdEventIds } });
        await Notification.destroy({ where: { related_event_id: createdEventIds } });
        await Event.destroy({ where: { event_id: createdEventIds } });
        console.log(`  Cleaned ${createdEventIds.length} test events and associated records.`);
      }
      if (createdUserIds.length > 0) {
        await Notification.destroy({ where: { user_id: createdUserIds } });
        await User.destroy({ where: { user_id: createdUserIds } });
        console.log(`  Cleaned ${createdUserIds.length} test users.`);
      }
      if (createdCategoryIds.length > 0) {
        await Category.destroy({ where: { category_id: createdCategoryIds } });
        console.log(`  Cleaned ${createdCategoryIds.length} test categories.`);
      }
      console.log('✅ Cleanup complete. Database is clean.');
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr.message);
    }
  }

  console.log('\n========================================================');
  console.log(`🏆 BI-DIRECTIONAL SYNC SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  return { passed, failed };
}

if (require.main === module) {
  runSyncIntegrationTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

module.exports = runSyncIntegrationTests;
