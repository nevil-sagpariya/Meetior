if (!/^meetior_test_\d+_\d+$/.test(process.env.DB_NAME || '')) throw new Error('Run npm test: this suite requires a disposable test database.');
'use strict';

const axios = require('axios');
const BASE = 'http://localhost:5000';

async function runAdminTests() {
  console.log('\n============================================================');
  console.log('🧪 RUNNING MEETIOR ADMIN & MODERATION TEST SUITE');
  console.log('============================================================');

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

  try {
    // 1. Admin Login
    console.log('\n[1] Admin Authentication');
    const adminLoginRes = await axios.post(`${BASE}/api/auth/login`, {
      email: 'admin@meetior.in',
      password: 'Admin@123',
    });
    assert(adminLoginRes.status === 200, 'Admin login HTTP 200');
    assert(adminLoginRes.data.user.role === 'Admin', 'User role is Admin');
    const adminToken = adminLoginRes.data.token;
    const adminAuthHeader = { headers: { Authorization: `Bearer ${adminToken}` } };

    // 2. Regular Attendee cannot access Admin routes
    console.log('\n[2] RBAC Verification (Attendee blocked from Admin routes)');
    const attendeeLoginRes = await axios.post(`${BASE}/api/auth/login`, {
      email: 'attendee@meetior.in',
      password: 'Meetior2026',
    });
    const attendeeToken = attendeeLoginRes.data.token;
    const attendeeAuthHeader = { headers: { Authorization: `Bearer ${attendeeToken}` } };

    let rbacBlocked = false;
    try {
      await axios.get(`${BASE}/api/admin/overview`, attendeeAuthHeader);
    } catch (err) {
      if (err.response && err.response.status === 403) rbacBlocked = true;
    }
    assert(rbacBlocked, 'Attendee receives 403 Forbidden on /api/admin/overview');

    // 3. Admin Overview Endpoint
    console.log('\n[3] Admin Overview Metrics');
    const overviewRes = await axios.get(`${BASE}/api/admin/overview`, adminAuthHeader);
    assert(overviewRes.status === 200, 'Overview returns HTTP 200');
    assert(overviewRes.data.stats !== undefined, 'Stats object present');
    assert(overviewRes.data.stats.users.total >= 1, 'Total users >= 1');
    assert(overviewRes.data.stats.events.total >= 1, 'Total events >= 1');

    // 4. User Accounts Management
    console.log('\n[4] User Management & Suspension');
    const usersRes = await axios.get(`${BASE}/api/admin/users`, adminAuthHeader);
    assert(usersRes.status === 200, 'Get admin users returns HTTP 200');
    assert(usersRes.data.users.length > 0, 'Users list populated');

    // Find attendee user
    const targetUser = usersRes.data.users.find(u => u.email === 'attendee@meetior.in');
    assert(targetUser !== undefined, 'Found attendee@meetior.in in user list');

    // Suspend attendee
    const suspendRes = await axios.patch(
      `${BASE}/api/admin/users/${targetUser.user_id}/status`,
      { account_status: 'suspended' },
      adminAuthHeader
    );
    assert(suspendRes.data.success, 'Attendee account suspended');

    // Verify suspended attendee cannot login
    let loginBlocked = false;
    try {
      await axios.post(`${BASE}/api/auth/login`, {
        email: 'attendee@meetior.in',
        password: 'Meetior2026',
      });
    } catch (err) {
      if (err.response && err.response.status === 403) loginBlocked = true;
    }
    assert(loginBlocked, 'Suspended user login blocked with 403');

    // Reactivate attendee
    const reactivateRes = await axios.patch(
      `${BASE}/api/admin/users/${targetUser.user_id}/status`,
      { account_status: 'active' },
      adminAuthHeader
    );
    assert(reactivateRes.data.success, 'Attendee account reactivated');

    // Verify attendee can login again
    const reLoginRes = await axios.post(`${BASE}/api/auth/login`, {
      email: 'attendee@meetior.in',
      password: 'Meetior2026',
    });
    assert(reLoginRes.status === 200, 'Reactivated attendee logs in successfully');

    // 5. Content Reports
    console.log('\n[5] Content Reports Workflow');
    // Attendee submits a report on event #1
    const reportSubmitRes = await axios.post(
      `${BASE}/api/reports`,
      {
        target_type: 'event',
        target_id: 1,
        reason: 'Inappropriate or misleading description',
        description: 'Test report submitted during verification.',
      },
      attendeeAuthHeader
    );
    assert(reportSubmitRes.status === 201, 'Report created HTTP 201');
    const reportId = reportSubmitRes.data.report_id;

    // Admin views reports
    const getReportsRes = await axios.get(`${BASE}/api/admin/reports?status=pending`, adminAuthHeader);
    assert(getReportsRes.data.reports.some(r => r.report_id === reportId), 'Created report found in pending reports');

    // Admin resolves report
    const resolveRes = await axios.patch(
      `${BASE}/api/admin/reports/${reportId}/status`,
      { status: 'resolved', resolution_notes: 'Verified and resolved during test run.' },
      adminAuthHeader
    );
    assert(resolveRes.data.success, 'Report marked as resolved');

    // 6. Event Moderation & Discovery Filter
    console.log('\n[6] Event Moderation & Feed Protection');
    // Moderate Event #1 -> Hide it
    const hideEventRes = await axios.patch(
      `${BASE}/api/admin/events/1/moderate`,
      { moderation_status: 'Hidden', reason: 'Automated moderation test' },
      adminAuthHeader
    );
    assert(hideEventRes.data.success, 'Event #1 marked as Hidden');

    // Public events discovery should NOT include Hidden event #1
    const publicEventsRes = await axios.get(`${BASE}/api/events`);
    const isHiddenInPublic = publicEventsRes.data.events.some(e => e.event_id === 1);
    assert(!isHiddenInPublic, 'Hidden event #1 excluded from public events discovery');

    // Admin events list DOES include Hidden event #1
    const adminEventsRes = await axios.get(`${BASE}/api/admin/events?moderation_status=Hidden`, adminAuthHeader);
    assert(adminEventsRes.data.events.some(e => e.event_id === 1), 'Hidden event #1 visible in Admin panel');

    // Restore Event #1 -> Approved
    const restoreEventRes = await axios.patch(
      `${BASE}/api/admin/events/1/moderate`,
      { moderation_status: 'Approved', reason: 'Restoring event #1' },
      adminAuthHeader
    );
    assert(restoreEventRes.data.success, 'Event #1 restored to Approved');

    // Public events discovery now DOES include event #1 again
    const publicEventsRes2 = await axios.get(`${BASE}/api/events`);
    const isRestoredInPublic = publicEventsRes2.data.events.some(e => e.event_id === 1);
    assert(isRestoredInPublic, 'Restored event #1 reappears in public events discovery');

    // 7. Admin Audit Logs
    console.log('\n[7] Administrative Audit Trail');
    const auditRes = await axios.get(`${BASE}/api/admin/audit-logs`, adminAuthHeader);
    assert(auditRes.status === 200, 'Audit logs HTTP 200');
    assert(auditRes.data.logs.length >= 3, 'Audit logs recorded multiple admin operations');

    console.log('\n============================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runAdminTests();
