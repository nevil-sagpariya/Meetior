# Meetior Backend Utilities

This directory contains runtime helper utilities and database management tools.

## Runtime Utilities (Active in Application)

- `cityResolver.js`: Resolves state, district, and city geography coordinates for events and user profiles.
- `mfa.js`: Multi-Factor Authentication (TOTP secret generation, QR code URLs, token verification).
- `ticketQr.js`: Generates cryptographic QR tokens for digital event check-in passes.
- `cleanDemoUsers.js`: Cleans mock/demo accounts; exposed via admin panel and CLI.

## Database & Maintenance Tools

- `seeder.js`: Seeds foundational categories, demo accounts, and sample events.
- `seedPublicGatherings.js`: Seeds authentic local Indian gatherings across key metro cities.
- `seedLocationsAndSyncDB.js`: Seeds comprehensive 36 states/UTs and major Indian district/city directories.
- `downloadEventImages.js`: Downloads and caches category banner images for events.
- `cleanupTestData.js`: Cleans isolated test records and stale test transactions.
- `viewDatabase.js`: Interactive terminal viewer for exploring database tables.
