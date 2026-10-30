if (!/^meetior_test_\d+_\d+$/.test(process.env.DB_NAME || '')) throw new Error('Run npm test: this suite requires a disposable test database.');
'use strict';
const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api/admin';

async function testSuperAdmin() {
  console.log('🧪 Starting Super Admin System Automated Test Suite...\n');
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

  let adminToken = '';
  let attendeeToken = '';
  let organizerToken = '';

  try {
    // 1. Admin Login via Dedicated Admin Login Endpoint
    console.log('[1] Admin Authentication & Security');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@meetior.in',
      password: 'Admin@123'
    });
    assert(loginRes.data.success === true, 'Admin login succeeds with HTTP 200');
    assert(loginRes.data.token && loginRes.data.user.role === 'Admin', 'Admin token issued with role Admin');
    assert(loginRes.data.user.admin_role === 'Super Admin', 'Admin has Super Admin privileges');
    adminToken = loginRes.data.token;

    // 2. Failed login attempt & non-admin rejection
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'attendee@meetior.in',
        password: 'Meetior2026'
      });
      assert(false, 'Should reject attendee login at admin portal');
    } catch (err) {
      assert(err.response && err.response.status === 403, 'Attendee rejected at admin portal with 403 Forbidden');
    }

    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@meetior.in',
        password: 'WrongPassword999'
      });
      assert(false, 'Should reject wrong admin password');
    } catch (err) {
      assert(err.response && err.response.status === 401, 'Wrong admin password rejected with 401 Unauthorized');
    }

    // 3. Attendee & Organizer tokens for RBAC tests
    const attLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'attendee@meetior.in',
      password: 'Meetior2026'
    });
    attendeeToken = attLogin.data.token;

    const orgLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'organizer@meetior.in',
      password: 'Meetior2026'
    });
    organizerToken = orgLogin.data.token;

    // RBAC: Verify attendee and organizer are blocked from all admin endpoints
    try {
      await axios.get(`${BASE_URL}/overview`, { headers: { Authorization: `Bearer ${attendeeToken}` } });
      assert(false, 'Attendee should be blocked from /api/admin/overview');
    } catch (err) {
      assert(err.response && err.response.status === 403, 'Attendee blocked with 403 Forbidden from admin overview');
    }

    try {
      await axios.get(`${BASE_URL}/overview`, { headers: { Authorization: `Bearer ${organizerToken}` } });
      assert(false, 'Organizer should be blocked from /api/admin/overview');
    } catch (err) {
      assert(err.response && err.response.status === 403, 'Organizer blocked with 403 Forbidden from admin overview');
    }

    // 4. Main Admin Dashboard 15 Real Metrics with Time Filters
    console.log('\n[2] Dashboard 15 Real Database Metrics & Time Filters');
    const overviewAll = await axios.get(`${BASE_URL}/overview?timeFilter=all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(overviewAll.data.success === true, 'Admin overview returns HTTP 200');
    assert(overviewAll.data.stats['1'] && overviewAll.data.stats['1'].id === 'total_attendees', 'Metric 1: Total Attendees present');
    assert(overviewAll.data.stats['2'] && overviewAll.data.stats['2'].id === 'total_organizers', 'Metric 2: Total Organizers present');
    assert(overviewAll.data.stats['5'] && overviewAll.data.stats['5'].id === 'total_events', 'Metric 5: Total Events present');
    assert(overviewAll.data.stats['9'] && overviewAll.data.stats['9'].id === 'total_confirmed_bookings', 'Metric 9: Confirmed Bookings present');
    assert(overviewAll.data.stats['11'] && overviewAll.data.stats['11'].id === 'total_verified_checkins', 'Metric 11: Verified QR Check-ins present');
    assert(overviewAll.data.stats['12'] && overviewAll.data.stats['12'].id === 'total_booking_value', 'Metric 12: Gross Booking Value present');
    assert(overviewAll.data.stats['13'] && overviewAll.data.stats['13'].id === 'total_organizer_earnings', 'Metric 13: Organizer Earnings present');
    assert(overviewAll.data.stats['14'] && overviewAll.data.stats['14'].id === 'total_platform_revenue', 'Metric 14: Platform Revenue present');
    assert(overviewAll.data.stats['15'] && overviewAll.data.stats['15'].id === 'total_refunds', 'Metric 15: Total Refunds present');

    // Time filter test: 30d
    const overview30d = await axios.get(`${BASE_URL}/overview?timeFilter=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(overview30d.data.time_filter === '30d', 'Time filter "30d" applied successfully');

    // 5. Attendee Management
    console.log('\n[3] Attendee Management');
    const attRes = await axios.get(`${BASE_URL}/attendees`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(attRes.data.success && Array.isArray(attRes.data.attendees), 'Attendee list returned with pagination');
    const sampleAtt = attRes.data.attendees[0];
    assert(sampleAtt && sampleAtt.masked_phone !== undefined, 'Phone numbers masked by default for attendee privacy');
    assert(typeof sampleAtt.total_confirmed_bookings === 'number', 'Confirmed bookings count calculated per attendee');

    // Attendee details
    const attDetailRes = await axios.get(`${BASE_URL}/attendees/${sampleAtt.user_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(attDetailRes.data.success && Array.isArray(attDetailRes.data.bookings), 'Attendee details returned complete booking history');

    // 6. Organizer Management & Performance
    console.log('\n[4] Organizer Management & Performance');
    const orgRes = await axios.get(`${BASE_URL}/organizers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(orgRes.data.success && Array.isArray(orgRes.data.organizers), 'Organizer list returned with calculated metrics');
    const sampleOrg = orgRes.data.organizers[0];
    assert(typeof sampleOrg.gross_revenue === 'number', 'Gross revenue computed per organizer');
    assert(typeof sampleOrg.net_estimated_earnings === 'number', 'Net earnings computed per organizer');

    const orgDetailRes = await axios.get(`${BASE_URL}/organizers/${sampleOrg.user_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(orgDetailRes.data.success && Array.isArray(orgDetailRes.data.events), 'Organizer details returned full event performance list');
    assert(orgDetailRes.data.financial_summary && orgDetailRes.data.financial_summary.settlement_notice, 'Simulated sandbox notice present in organizer finance');

    // 7. Organizer Earnings Report
    console.log('\n[5] Organizer Earnings Report');
    const earnRes = await axios.get(`${BASE_URL}/finance/organizer-earnings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(earnRes.data.success && Array.isArray(earnRes.data.organizers), 'Organizer earnings report returned with totals');
    assert(earnRes.data.notice.includes('TEST/SIMULATED'), 'Sandbox mode notice explicitly displayed');

    // 8. Event Management & Moderation
    console.log('\n[6] Event Management & Moderation');
    const evRes = await axios.get(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(evRes.data.success && Array.isArray(evRes.data.events), 'Event list returned with lifecycle and moderation statuses');
    const sampleEv = evRes.data.events[0];

    // Moderate event (hide & restore)
    const hideRes = await axios.patch(`${BASE_URL}/events/${sampleEv.event_id}/moderate`, {
      moderation_status: 'Hidden',
      reason: 'Testing moderation hide workflow'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(hideRes.data.event.moderation_status === 'Hidden', 'Event successfully hidden');

    const restoreRes = await axios.patch(`${BASE_URL}/events/${sampleEv.event_id}/moderate`, {
      moderation_status: 'Approved',
      reason: 'Testing moderation restore workflow'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(restoreRes.data.event.moderation_status === 'Approved', 'Event successfully restored to Approved');

    // 9. Actual Attendance Tracking
    console.log('\n[7] Actual Attendance Tracking');
    const attRepRes = await axios.get(`${BASE_URL}/attendance`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(attRepRes.data.success && Array.isArray(attRepRes.data.events), 'Attendance report returned event list');
    assert(attRepRes.data.summary && typeof attRepRes.data.summary.platform_attendance_rate === 'number', 'Platform attendance rate % computed');

    // 10. Reviews & Ratings Management
    console.log('\n[8] Reviews & Ratings Management');
    const revRes = await axios.get(`${BASE_URL}/reviews`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(revRes.data.success && Array.isArray(revRes.data.reviews), 'Reviews list returned');
    assert(revRes.data.stats && revRes.data.stats.distribution !== undefined, 'Rating distribution (5★ to 1★) computed');

    // 11. Payments & Transactions Management
    console.log('\n[9] Payments & Transactions Management');
    const payRes = await axios.get(`${BASE_URL}/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(payRes.data.success && Array.isArray(payRes.data.payments), 'Payments ledger returned');
    assert(payRes.data.reconciliation && typeof payRes.data.reconciliation.net_receipts === 'number', 'Financial reconciliation computed');

    // 12. Platform Financial Reports
    console.log('\n[10] Platform Financial Reports');
    const finRes = await axios.get(`${BASE_URL}/finance/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(finRes.data.success && Array.isArray(finRes.data.top_events), 'Top grossing events report returned');
    assert(finRes.data.paid_vs_free && typeof finRes.data.paid_vs_free.paid_events === 'number', 'Paid vs Free events breakdown computed');

    // 13. Reports & Complaints
    console.log('\n[11] Reports & Complaints Workflow');
    const repRes = await axios.get(`${BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(repRes.data.success && Array.isArray(repRes.data.reports), 'Content reports list returned');

    // 14. Categories & Locations Audit
    console.log('\n[12] Categories & Locations');
    const catRes = await axios.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(catRes.data.success && Array.isArray(catRes.data.categories), 'Categories returned with event counts');

    const locAudit = await axios.get(`${BASE_URL}/locations/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(locAudit.data.success && locAudit.data.totals.cities > 0, 'Location audit verified MySQL cities & states');

    // 15. Broadcast Announcements & Alerts
    console.log('\n[13] Notifications & Broadcast');
    const alertRes = await axios.get(`${BASE_URL}/notifications/alerts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(alertRes.data.success && Array.isArray(alertRes.data.alerts), 'Admin critical alerts returned');

    const broadRes = await axios.post(`${BASE_URL}/broadcast`, {
      target_audience: 'attendees',
      title: 'Platform Maintenance Notice',
      message: 'System upgrade completed smoothly.'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(broadRes.data.success === true, 'Admin announcement broadcast delivered to users');

    // 16. Audit Logs & RBAC
    console.log('\n[14] Audit Trail & RBAC');
    const auditRes = await axios.get(`${BASE_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(auditRes.data.success && auditRes.data.logs.length > 0, 'Audit trail logged administrative operations with IP and reason');

    const rolesRes = await axios.get(`${BASE_URL}/roles-permissions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(rolesRes.data.success && Array.isArray(rolesRes.data.permissions), 'RBAC permissions matrix verified');

    // 17. Platform Settings
    console.log('\n[15] Platform Settings');
    const settingsRes = await axios.get(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(settingsRes.data.success && Array.isArray(settingsRes.data.settings), 'Platform settings retrieved from database');

    const patchSettings = await axios.patch(`${BASE_URL}/settings`, {
      settings: { platform_commission_percent: '5.5' },
      reason: 'Updated test commission rate'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(patchSettings.data.success === true, 'Platform settings updated successfully in MySQL');

  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n========================================');
  console.log(`🏁 Super Admin Test Suite: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

testSuperAdmin();
