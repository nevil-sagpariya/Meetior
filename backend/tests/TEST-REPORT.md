# Meetior integration test report

Tested source: D:\Project Sem -7\meetior
Date: 27 October 2026 (Asia/Kolkata)

## Result

144 checks passed and 5 city-directory checks failed. The five failures remain explicitly recorded in isolated-results.json. All four existing suites also completed successfully: API (17 assertions, including one skipped paid-checkout scenario), admin (24), super admin (49), and cancellation/revenue (14). Their suite-level results are included in the 144, so these totals must not simply be added together.

This is evidence for the scenarios below, not proof of every possible input or every Indian locality.

## Isolation and cleanup

Each run creates a uniquely named meetior_test_<timestamp>_<pid> MySQL database. Only location, category and role-permission reference tables are copied from the configured database. No production users, passwords, bookings or payments are copied. All synthetic accounts, events, transactions and notifications are written into the disposable database.

The tests import the real Express application and bind a separate randomly assigned loopback port. Existing tests are redirected to this port in memory. They are guarded against direct execution on a non-test database. The main port 5000 is not used for test mutations.

The test database is dropped in a finally block, and its absence is checked. Cleanup succeeded on the final run. Browser profiles were temporary and closed. Browser screenshots and test logs remain as evidence; they contain synthetic test data.

## Connected scenarios exercised

| Area | Evidence |
| --- | --- |
| Registration | New attendees and organizers register, invalid email/password/admin-role requests are rejected, duplicate email is rejected. Manually entered Imphal registration succeeds through the actual browser form without a city suggestion. |
| City discovery | Mumbai events appear for Mumbai. Navi Mumbai and Ahmedabad events do not. Empty cities show an empty state instead of unrelated national or demo events. |
| Publication notifications | Each new Mumbai event creates one notification for each active Mumbai attendee in Maharashtra. Other cities, organizers, and suspended attendees are excluded. Duplicate publication requests do not duplicate the notification. |
| Booking and QR | Free booking creates a pass; duplicate booking is rejected; another user cannot retrieve the ticket; valid organizer scan succeeds; a second scan is rejected. Simultaneous requests cannot overbook a one-seat event. |
| Reminders and changes | Scheduled reminder runs twice but delivers once. Confirmed attendees receive event-change and cancellation notifications. |
| Reviews | Checked-in users can review; unverified attendees cannot. |
| Admin data | New accounts, events, bookings, attendance and a synthetic settled payment appear in admin responses. Financial totals update for the synthetic transaction. |
| Admin browser UI | All 14 tabs render without undefined, NaN, invalid dates or stuck loading. Organizer performance and event inspection show actual linked test records. |
| Permissions | Attendees cannot use admin/organizer functions. An unrelated organizer cannot edit events. Support admins cannot change platform settings. Pending MFA tokens cannot access protected admin endpoints. |
| Maps | Actual browser map tiles load. Pins retain Mumbai, Guwahati and Imphal coordinates. External geocoding resolves Guwahati. Nearby search finds Mumbai coordinates, excludes hidden events, and rejects invalid coordinates. |
| Payments | Missing credentials cannot produce a pretend order. The legacy fake signature is rejected and leaves a booking pending. Isolated database fixtures test payment/finance reporting; no provider transaction was made. |
| Existing suites | API, administration, super administration, cancellation policy and revenue tests were run against the disposable database. |

## Remaining gaps

The reference city API returned no matching records for Guwahati, Imphal, Leh, Kavaratti and Port Blair. All eight sampled cities accepted API registration; manual Imphal registration also passed in the browser. The existing directory is therefore incomplete even though a missing suggestion does not prevent manual city entry. A complete, verified India city/PIN-code dataset has not been imported into the main database.

Valid Razorpay test credentials and an actual provider checkout are still needed to verify successful capture and actual refund processing end to end. The legacy API suite skipped its paid-checkout branch because its Ahmedabad fixture has no paid event. The additional tests explicitly cover payment rejection and synthetic reporting; they do not certify real payments.

Map coverage was sampled, not tested at every coordinate. Geocoding and tiles depend on external providers. GPS permission, physical camera scanning and delivery through external email/SMS/push providers were not verified. Notification tests cover the application's in-app inbox.

## Fixes made during testing

- Exact city filtering and removal of cross-city/demo fallback feeds.
- City/state publication notifications inserted in the same transaction as the new event.
- National map search instead of an automatic Gujarat suffix; invalid-coordinate validation.
- Registration form initialization and API origin handling for isolated/local ports.
- Organizer, earnings, finance, review, location-audit, role, settings and detail-modal field mappings.
- Review attendance enforcement, admin role loading and pending-MFA rejection.
- Reminder scheduled-time loading and end-of-event no-show calculation.
- Removal of fake payment order/signature/provider fallbacks and the instant-demo payment button.
- Reusable isolated API/browser tests and safeguards on the old test files.

The main backend was restarted after testing so the code changes take effect on port 5000. Normal server startup uses its existing schema synchronization and reminder worker; no synthetic test scenarios were executed there.

## Re-run

From D:\Project Sem -7\meetior\backend, run npm test.

The MySQL account must have permission to create and drop the uniquely named test database. Browser checks use the bundled Playwright runtime and installed Microsoft Edge. The script exits nonzero while the five directory coverage failures remain.

Evidence: isolated-results.json, isolated-run.log and artifacts/admin-*.png in this folder.

