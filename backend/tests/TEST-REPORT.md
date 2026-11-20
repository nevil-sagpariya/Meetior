# Meetior integration test report

Tested source: D:\Project Sem -7\meetior
Date: 18 November 2026 (Asia/Kolkata)

## Result

150 checks passed and 0 checks failed. All 150 checks are explicitly recorded in isolated-results.json. All existing suites completed successfully: API (17 assertions, including one skipped paid-checkout scenario), admin (24), super admin (49), cancellation/revenue (14), and isolated integration/browser contracts. The test database is created, verified, and dropped cleanly on every run.

This is evidence for the scenarios below, not proof of every possible input or every Indian locality.

## Isolation and cleanup

Each run creates a uniquely named meetior_test_<timestamp>_<pid> MySQL database. Only location, category and role-permission reference tables are copied from the configured database. No production users, passwords, bookings or payments are copied. All synthetic accounts, events, transactions and notifications are written into the disposable database.

The tests import the real Express application and bind a separate randomly assigned loopback port. Existing tests are redirected to this port in memory. They are guarded against direct execution on a non-test database. The main port 5000 is not used for test mutations.

The test database is dropped in a finally block, and its absence is checked. Cleanup succeeded on the final run (`cleaned: true`, database removed). Browser profiles were temporary and closed. Browser screenshots and test logs remain as evidence; they contain synthetic test data.

## Connected scenarios exercised

| Area | Evidence |
| --- | --- |
| Registration | New attendees and organizers register, invalid email/password/admin-role requests are rejected, duplicate email is rejected. Manually entered cities (e.g. Imphal, Leh, Guwahati, Kavaratti, Port Blair) succeed through the browser form with datalist suggestions while preserving free manual entry. |
| City discovery | Mumbai events appear for Mumbai. Navi Mumbai and Ahmedabad events do not. Empty cities show an empty state instead of unrelated national or demo events. |
| Publication notifications | Each new Mumbai event creates one notification for each active Mumbai attendee in Maharashtra. Other cities, organizers, and suspended attendees are excluded. Duplicate publication requests do not duplicate the notification. |
| Booking and QR | Free booking creates a pass; duplicate booking is rejected; another user cannot retrieve the ticket; valid organizer scan succeeds; a second scan is rejected. Passes use HMAC-SHA256 authenticated tokens (`MTR1:<ticket_id>:<issuedAt>:<signature>`) with SHA-256 hash storage and timing-safe signature comparison. Simultaneous requests cannot overbook a one-seat event. |
| Reminders and changes | Scheduled reminder runs twice but delivers once. Confirmed attendees receive event-change and cancellation notifications. |
| Reviews | Checked-in users can review; unverified attendees cannot. |
| Admin data | New accounts, events, bookings, attendance and a synthetic settled payment appear in admin responses. Financial totals update for the synthetic transaction. Active commission setting (e.g. 3.0% or 5.0%) dynamically drives fee and net payout displays. |
| Admin browser UI | All 14 tabs render without undefined, NaN, invalid dates or stuck loading. Organizer performance and event inspection show actual linked test records. |
| Permissions | Attendees cannot use admin/organizer functions. An unrelated organizer cannot edit events. Support admins cannot change platform settings. Pending MFA tokens cannot access protected admin endpoints. |
| Maps | Actual browser map tiles load. Pins retain Mumbai, Guwahati and Imphal coordinates. External geocoding resolves Guwahati. Nearby search finds Mumbai coordinates, excludes hidden events, and rejects invalid coordinates. |
| Payments | Missing credentials cannot produce a pretend order. The legacy fake signature is rejected and leaves a booking pending. Database-only/simulated mode is clearly distinguished from live Razorpay checkout. Isolated database fixtures test payment/finance reporting; no real provider transaction was made. |
| Existing suites | API, administration, super administration, cancellation policy and revenue tests were run against the disposable database. |

## Remaining gaps & unverified external integrations

- **City directory coverage**: Guwahati, Imphal, Leh, Kavaratti, and Port Blair are now mapped in the reference directory and pass both registration and discovery checks. Full pan-India coverage across all 700+ districts relies on manual free-form city entry, which is preserved.
- **External payment gateway**: Valid Razorpay test credentials and an actual provider checkout are still needed to verify live capture and refund processing against Razorpay test servers. The platform accurately identifies when it is operating in Simulated / Database-Only Mode versus active Razorpay Test Gateway Mode. No real financial payments or charges occurred.
- **Hardware & network dependencies**: Map tiles and reverse geocoding rely on OpenStreetMap/Nominatim availability. Physical camera hardware scanning, live mobile GPS permissions, and external carrier push/SMS gateways remain unverified in headless automated testing; in-app inbox notifications and timing-safe token checks were verified.

## Fixes made during testing

- Exact city filtering and removal of cross-city/demo fallback feeds.
- City/state publication notifications inserted in the same transaction as the new event.
- National map search instead of an automatic Gujarat suffix; invalid-coordinate validation.
- Reference directory and state resolution mapping for Guwahati, Imphal, Leh, Kavaratti, Port Blair, Ranchi, Dehradun, Shimla, and Raipur.
- Dynamic platform commission percentage (reading active `platform_commission_percent`) across organizer revenues, admin metrics, finance ledgers, and settings previews.
- Clear distinction between confirmed Razorpay test transactions and simulated / database-only payment records.
- Authenticated HMAC-SHA256 QR pass issuance, SHA-256 hash persistence, and repeat-scan check-in protection.
- Organizer, earnings, finance, review, location-audit, role, settings and detail-modal field mappings.
- Review attendance enforcement, admin role loading and pending-MFA rejection.
- Reminder scheduled-time loading and end-of-event no-show calculation.
- Reusable isolated API/browser tests and safeguards on the old test files.

## Re-run

From `D:\Project Sem -7\meetior\backend`, run:
```bash
npm test
```

The MySQL account must have permission to create and drop the uniquely named test database. Browser checks use the bundled Playwright runtime and installed Microsoft Edge. The suite exits with code 0 (all 150 checks passing).

Evidence: `isolated-results.json`, `isolated-run.log` and `artifacts/admin-*.png` in this folder.

