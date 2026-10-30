# Meetior Database Entity Relationships & Constraints Specification

This document details all entity relationships, cardinalities, foreign key cascades, and integrity constraints across the 25 relational tables in the **Meetior** MySQL database (`meetior_db`).

---

## 1. System Architecture & Relational Topology

The database is structured into six functional modules:
1. **Identity & Authentication**: Users, Roles, Profile & Credential storage, Suspension states.
2. **Geographical & Postal Reference**: States, Districts, Cities, PostalCodes (Hierarchical administrative divisions of India).
3. **Event Lifecycle & Catalogs**: Categories, Events, EventPhotos, EventModeration.
4. **Registration, Ticketing & Payments**: Registrations, EventTickets, CheckIns, Payments.
5. **Community Engagement & Feedback**: DemandRequests, DemandSupporters, MotionSecondChances, SecondChanceRequests, EventReviews, InAppNotifications.
6. **Governance, Safety & Audit**: Reports, AdminAuditLogs.

```
                      +-------------------+
                      |   Postal Codes    |
                      +---------+---------+
                                |
                                v
+---------------+     +---------+---------+     +-------------------+
|  Categories   |     |    Locations      |     |       Users       |
+-------+-------+     +---------+---------+     +----+---------+----+
        |                       |                    |         |
        +------------+   +------+                    |         |
                     |   |                           |         |
                     v   v                           |         |
                +----+---+----+                      |         |
                |   Events    |<---------------------+         |
                +------+------+  (organizer_id)                |
                       |                                       |
       +---------------+---------------+                       |
       |               |               |                       |
       v               v               v                       v
+------+------+ +------+------+ +------+------+         +------+------+
| Registrations | | 2nd Chance | |  Reviews   |         |   Demand    |
+------+------+ +------+------+ +------+------+         +------+------+
       |                                                       |
       +---------------+                                       v
       |               |                                +------+------+
       v               v                                | Supporters  |
+------+------+ +------+------+                         +-------------+
|   Tickets   | |  Payments   |
+------+------+ +-------------+
       |
       v
+------+------+
|  Check-Ins  |
+-------------+
```

---

## 2. Table-by-Table Relationship Matrix

| # | Entity A | Cardinality | Entity B | Foreign Key | On Delete | On Update | Description |
|---|---|:---:|---|---|---|---|---|
| 1 | `States` | 1 : N | `Districts` | `districts.state_id` | RESTRICT | CASCADE | Administrative state contains districts |
| 2 | `Districts` | 1 : N | `Cities` | `cities.district_id` | RESTRICT | CASCADE | District contains urban / rural cities |
| 3 | `Districts` | 1 : N | `PostalCodes` | `postal_codes.district_id` | RESTRICT | CASCADE | District contains pin code zones |
| 4 | `States` | 1 : N | `PostalCodes` | `postal_codes.state_id` | RESTRICT | CASCADE | State references for postal code validation |
| 5 | `Cities` | 1 : N | `PostalCodes` | `postal_codes.city_id` | SET NULL | CASCADE | Optional mapping to canonical city node |
| 6 | `Users` | 1 : N | `Events` | `events.organizer_id` | RESTRICT | CASCADE | Organizer hosts and administers events |
| 7 | `Categories` | 1 : N | `Events` | `events.category_id` | RESTRICT | CASCADE | Classification taxonomy for discovery |
| 8 | `Events` | 1 : N | `EventPhotos` | `event_photos.event_id` | CASCADE | CASCADE | Gallery and uploaded visual assets |
| 9 | `Users` | 1 : N | `Registrations` | `registrations.user_id` | RESTRICT | CASCADE | Attendee books seat in an event |
| 10 | `Events` | 1 : N | `Registrations` | `registrations.event_id` | RESTRICT | CASCADE | Event manages attendee bookings |
| 11 | `Registrations` | 1 : 1 | `EventTickets` | `event_tickets.registration_id` | CASCADE | CASCADE | Unique cryptographic QR digital pass |
| 12 | `Events` | 1 : N | `EventTickets` | `event_tickets.event_id` | CASCADE | CASCADE | Direct link to event pass validation |
| 13 | `EventTickets` | 1 : 1 | `CheckIns` | `check_ins.ticket_id` | CASCADE | CASCADE | Attendance verification timestamp & scanner |
| 14 | `Users` | 1 : N | `CheckIns` | `check_ins.scanned_by` | RESTRICT | CASCADE | Organizer / staff member who verified pass |
| 15 | `Registrations` | 1 : 1 | `Payments` | `payments.registration_id` | CASCADE | CASCADE | Razorpay order & transaction settlement |
| 16 | `Events` | 1 : 1 | `MotionSecondChances`| `motion_second_chances.event_id` | CASCADE | CASCADE | Repeat demand tally for completed events |
| 17 | `MotionSecondChances` | 1 : N | `SecondChanceRequests` | `second_chance_requests.motion_id` | CASCADE | CASCADE | Individual user votes for event repeat |
| 18 | `Users` | 1 : N | `SecondChanceRequests` | `second_chance_requests.user_id` | CASCADE | CASCADE | Individual attendee request tracking |
| 19 | `Users` | 1 : N | `DemandRequests` | `demand_requests.created_by` | RESTRICT | CASCADE | User requesting new meetup / event topic |
| 20 | `Categories` | 1 : N | `DemandRequests` | `demand_requests.category_id` | RESTRICT | CASCADE | Categorization for demand discovery |
| 21 | `DemandRequests`| 1 : N | `DemandSupporters` | `demand_supporters.demand_id` | CASCADE | CASCADE | Upvotes / co-signers backing demand |
| 22 | `Users` | 1 : N | `DemandSupporters` | `demand_supporters.user_id` | CASCADE | CASCADE | Attendee upvote tracking |
| 23 | `Events` | 1 : N | `EventReviews` | `event_reviews.event_id` | CASCADE | CASCADE | Star rating and attendee feedback |
| 24 | `Users` | 1 : N | `EventReviews` | `event_reviews.user_id` | RESTRICT | CASCADE | Author of verified review |
| 25 | `Users` | 1 : N | `InAppNotifications` | `in_app_notifications.user_id` | CASCADE | CASCADE | In-app notification inbox entries |
| 26 | `Users` | 1 : N | `Reports` | `reports.reported_by` | RESTRICT | CASCADE | User submitting moderation flag |
| 27 | `Events` | 1 : N | `Reports` | `reports.event_id` | CASCADE | CASCADE | Event target of report flag |
| 28 | `Events` | 1 : N | `EventModeration` | `event_moderation.event_id` | CASCADE | CASCADE | Administrative moderation decision trail |
| 29 | `Users` | 1 : N | `EventModeration` | `event_moderation.admin_id` | RESTRICT | CASCADE | Admin user who performed moderation action |
| 30 | `Users` | 1 : N | `AdminAuditLogs` | `admin_audit_logs.admin_id` | RESTRICT | CASCADE | System audit trail for administrative changes |

---

## 3. Entity Group Analysis

### 3.1 Location Hierarchy
- **States -> Districts -> Cities -> PostalCodes**:
  - `States` is the top-level root.
  - `Districts` has a composite uniqueness or indexed foreign key `state_id`.
  - `Cities` references `district_id`.
  - `PostalCodes` maps a 6-digit PIN code to a `district_id` and `state_id`, with an optional `city_id` link.
  - Cascade Policy: Deleting or re-keying a state cascades through district and postal lookups, while city deletion sets postal references to NULL to avoid data loss.

### 3.2 Users, Roles & Security
- **Roles**: `Attendee`, `Organizer`, `Admin`.
- **Account Status**: `active`, `suspended`.
- **Integrity Rule**:
  - Organizers and Attendees who have booked tickets or published events cannot be hard-deleted via `CASCADE` (`RESTRICT` on delete). If moderation requires removing access, `account_status` is updated to `'suspended'`.
  - The last remaining `Admin` cannot be suspended or demoted, enforced at the controller layer and recorded in `AdminAuditLogs`.

### 3.3 Event Lifecycle & Moderation
- **Status Lifecycle**: `Draft` -> `Published` -> `Ongoing` -> `Completed` / `Cancelled`.
- **Moderation Status**: `Approved`, `Hidden`, `UnderReview`.
- **Public Visibility Filter**:
  - Only events where `status = 'Published' AND moderation_status = 'Approved'` are exposed to general attendees in Browse and Home feeds.
  - Organizers retain visibility of their own drafts and hidden events in their management portal.
  - Admins can query and moderate all events regardless of status.

### 3.4 Registrations, Ticketing & Capacity Locking
- **Registration**:
  - Stores `status` (`Confirmed`, `Cancelled`, `Waitlisted`).
  - `total_amount` reflects ticket pricing at booking time.
- **Concurrency Mutex**:
  - Capacity calculation evaluates `COUNT(registrations.registration_id)` where `status = 'Confirmed'` against `events.max_capacity`.
  - Registrations generate a 1-to-1 `EventTickets` record.
  - When a registration is cancelled, `EventTickets.is_valid` is set to `FALSE` (0), invalidating QR passes immediately.
- **Cryptographic Security**:
  - `EventTickets` stores `ticket_code` (unique human-readable serial e.g., `TKT-2026-X8Y9Z`), `qr_payload_hash` (SHA256 signature including secret salt), and `qr_code_url`.

### 3.5 Check-Ins & Attendance
- **1-to-1 Relationship**: `EventTickets` -> `CheckIns`.
- **Verification Rule**:
  - A ticket cannot be checked in more than once (`ticket_id` is unique in `check_ins`).
  - Scan operation logs `scanned_by` (Organizer/Admin ID), `check_in_time`, and device IP/metadata.
  - Successful check-in unlocks review submission permissions for the attending user.

### 3.6 Financial Transactions (Razorpay Integration)
- **1-to-1 Relationship**: `Registrations` -> `Payments`.
- **Fields**:
  - `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `status` (`Created`, `Authorized`, `Captured`, `Failed`, `Refunded`).
- **Accounting Invariant**:
  - For free events (`events.is_paid = 0`), no row is required in `payments`, and `registration.status` defaults to `Confirmed` directly.
  - For paid events, `registration.status` remains pending or uncommitted until HMAC-SHA256 signature verification succeeds in `paymentController.js`.

### 3.7 Community Growth Engines

#### Motion Second Chance
- Attached to completed events.
- Tracks `target_attendees` and `current_requests`.
- `SecondChanceRequests` enforces a compound unique key `(motion_id, user_id)`: a user may only request an event rerun once.
- Once the threshold is met, the original organizer receives notification to duplicate or launch a new edition.

#### Demand Engine
- Community-originated event proposals.
- Supports state transitions: `Open` -> `InReview` -> `Fulfilled` -> `Closed`.
- `DemandSupporters` enforces compound unique key `(demand_id, user_id)` ensuring one upvote per attendee.
- Organizers can view demand rankings by city and convert high-demand ideas directly into new events with a single pre-filled action.

### 3.8 Verified Reviews
- `EventReviews` contains `rating` (1 to 5), `review_text`, `created_at`.
- Compound unique constraint `(event_id, user_id)`: prevents multiple reviews from the same account.
- **Attendance Verification**: Only accounts with an existing, valid `CheckIns` entry for `event_id` are permitted to submit reviews.

### 3.9 Moderation & Audit Architecture
- **Reports**: Flagged by users with `reason` and `description`. Targets events or users.
- **EventModeration**: Historical audit trail storing `admin_id`, `action` (`Approve`, `Hide`, `Warn`), and `moderator_notes`.
- **AdminAuditLogs**: System-wide administrative actions logged with action verb, target entity, record ID, IP address, and payload snapshot.

---

## 4. Referential Integrity & Cascade Rules Summary

```sql
-- Core cascades summary
ALTER TABLE event_photos 
  ADD CONSTRAINT fk_photos_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE;

ALTER TABLE event_tickets 
  ADD CONSTRAINT fk_tickets_reg FOREIGN KEY (registration_id) REFERENCES registrations(registration_id) ON DELETE CASCADE;

ALTER TABLE check_ins 
  ADD CONSTRAINT fk_checkins_ticket FOREIGN KEY (ticket_id) REFERENCES event_tickets(ticket_id) ON DELETE CASCADE;

ALTER TABLE payments 
  ADD CONSTRAINT fk_payments_reg FOREIGN KEY (registration_id) REFERENCES registrations(registration_id) ON DELETE CASCADE;

ALTER TABLE demand_supporters 
  ADD CONSTRAINT fk_demand_supp FOREIGN KEY (demand_id) REFERENCES demand_requests(demand_id) ON DELETE CASCADE;

ALTER TABLE second_chance_requests 
  ADD CONSTRAINT fk_secondchance_motion FOREIGN KEY (motion_id) REFERENCES motion_second_chances(motion_id) ON DELETE CASCADE;

ALTER TABLE event_reviews 
  ADD CONSTRAINT fk_reviews_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE;

ALTER TABLE reports 
  ADD CONSTRAINT fk_reports_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE;
```
