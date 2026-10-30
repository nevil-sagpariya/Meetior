# Meetior Database Schema Documentation

**Database System:** MySQL 8.0+  
**Database Name:** `meetior_db`  
**ORM:** Sequelize (Node.js)  
**Default Engine:** InnoDB  
**Default Charset / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`  

---

## 1. Administrative Geography & Location Reference

### `States`
Stores all 28 Indian States and 8 Union Territories.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `state_id` | INT | PK, Auto Increment | Primary key |
| `state_name` | VARCHAR(100) | NOT NULL, UNIQUE | Full state / UT name |
| `state_code` | VARCHAR(10) | NOT NULL, UNIQUE | ISO / Postal 2-letter state code (e.g. GJ, MH, DL) |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |

### `Districts`
Official administrative districts belonging to Indian states.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `district_id` | INT | PK, Auto Increment | Primary key |
| `state_id` | INT | NOT NULL, FK → `States(state_id)` | Parent state |
| `district_name` | VARCHAR(100) | NOT NULL | District name (e.g. Gandhinagar, Surat) |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |

### `Cities`
Cities, towns, and verified localities mapped under their administrative districts.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `city_id` | INT | PK, Auto Increment | Primary key |
| `district_id` | INT | NOT NULL, FK → `Districts(district_id)` | Administrative district |
| `city_name` | VARCHAR(100) | NOT NULL | Name of city, town, or locality (e.g. Koba, Adalaj) |
| `city_type` | ENUM | NOT NULL, Default: `'Town'` | `'Tier-1'`, `'Tier-2'`, `'Tier-3'`, `'Town'`, `'Locality'` |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |

### `PostalCodes`
Indian PIN Code reference directory providing address suggestions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `postal_code_id` | INT | PK, Auto Increment | Primary key |
| `pincode` | VARCHAR(6) | NOT NULL, Indexed | 6-digit Indian Postal Index Number |
| `state_id` | INT | NOT NULL, FK → `States(state_id)` | Resolved state |
| `district_id` | INT | NOT NULL, FK → `Districts(district_id)` | Resolved district |
| `city_id` | INT | NULL, FK → `Cities(city_id)` | Associated city/town |
| `post_office_name` | VARCHAR(150) | NOT NULL | Official postal delivery office |
| `locality_name` | VARCHAR(150) | NOT NULL | Neighborhood / locality |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |

### `Locations`
Physical event venues and formatted address entities.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `location_id` | INT | PK, Auto Increment | Primary key |
| `venue_name` | VARCHAR(150) | NOT NULL | Specific venue name (e.g. Sabarmati Riverfront) |
| `formatted_address`| VARCHAR(255) | NOT NULL | Full address line |
| `locality` | VARCHAR(100) | NULL | Neighborhood or sector |
| `city` | VARCHAR(100) | NOT NULL, Indexed | Venue city |
| `district` | VARCHAR(100) | NULL | Venue district |
| `state` | VARCHAR(100) | NULL | Venue state |
| `discovery_city` | VARCHAR(100) | NULL, Indexed | Primary metro discovery bucket |
| `postal_code` | VARCHAR(10) | NULL | PIN code |
| `latitude` | DECIMAL(10,8) | NULL | Optional geographic latitude |
| `longitude` | DECIMAL(11,8) | NULL | Optional geographic longitude |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |

---

## 2. Authentication, Users & Roles

### `Users`
Registered accounts across all three platform roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | INT | PK, Auto Increment | Primary key |
| `name` | VARCHAR(100) | NOT NULL | Full user name |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE, Indexed | Normalized unique email |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | ENUM | NOT NULL, Default: `'Attendee'` | `'Attendee'`, `'Organizer'`, `'Admin'` |
| `account_status`| ENUM | NOT NULL, Default: `'active'` | `'active'`, `'suspended'` |
| `profile_image` | VARCHAR(255) | NULL | Path to avatar image |
| `city` | VARCHAR(100) | NULL | User's profile home city |
| `district` | VARCHAR(100) | NULL | User's home district |
| `state` | VARCHAR(100) | NULL | User's home state |
| `pincode` | VARCHAR(10) | NULL | User's postal PIN code |
| `created_at` | DATETIME | NOT NULL | Account creation date |
| `updated_at` | DATETIME | NOT NULL | Profile last modified |

---

## 3. Events & Discovery

### `Categories`
Event taxonomies for filtering and exploration.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `category_id` | INT | PK, Auto Increment | Primary key |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Display name (e.g. Art & Workshops) |
| `slug` | VARCHAR(50) | NOT NULL, UNIQUE | URL/filter slug (e.g. art) |
| `icon` | VARCHAR(20) | NOT NULL, Default: `'🎪'` | Crayon emoji / icon |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |

### `Events`
Core event listings with lifecycle and moderation statuses.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `event_id` | INT | PK, Auto Increment | Primary key |
| `organizer_id` | INT | NOT NULL, FK → `Users(user_id)` | Event creator |
| `category_id` | INT | NOT NULL, FK → `Categories(category_id)` | Event category |
| `location_id` | INT | NOT NULL, FK → `Locations(location_id)` | Venue location record |
| `original_event_id`| INT | NULL, FK → `Events(event_id)` | Linked event if repeat session |
| `title` | VARCHAR(150) | NOT NULL | Event headline |
| `description` | TEXT | NOT NULL | Full event description |
| `start_datetime` | DATETIME | NOT NULL, Indexed | Event starting time |
| `end_datetime` | DATETIME | NULL | Event ending time |
| `registration_deadline`| DATETIME | NULL | Registration closing cutoff |
| `capacity` | INT | NOT NULL, Default: 50 | Total seat capacity |
| `price` | DECIMAL(10,2)| NOT NULL, Default: 0.00 | Ticket cost (0 = free) |
| `currency` | VARCHAR(5) | NOT NULL, Default: `'INR'` | Currency code |
| `status` | ENUM | NOT NULL, Default: `'Published'` | `'Draft'`, `'Published'`, `'Ongoing'`, `'Cancelled'`, `'Completed'` |
| `moderation_status`| ENUM | NOT NULL, Default: `'Approved'` | `'Approved'`, `'Hidden'`, `'UnderReview'` |
| `special_code_enabled`| TINYINT(1)| NOT NULL, Default: 0 | Optional access code flag |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Modification timestamp |

### `EventImages`
Original local photographic uploads for events.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `image_id` | INT | PK, Auto Increment | Primary key |
| `event_id` | INT | NOT NULL, FK → `Events(event_id)` | Associated event |
| `image_url` | VARCHAR(255) | NOT NULL | Relative path in `/uploads/` |
| `is_primary` | TINYINT(1) | NOT NULL, Default: 1 | Featured banner flag |
| `created_at` | DATETIME | NOT NULL | Upload timestamp |

### `EventInteractions`
Attendee interactions (Going, Interested, Saved).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `interaction_id`| INT | PK, Auto Increment | Primary key |
| `user_id` | INT | NOT NULL, FK → `Users(user_id)` | Interacting user |
| `event_id` | INT | NOT NULL, FK → `Events(event_id)` | Target event |
| `interaction_type`| ENUM | NOT NULL | `'Going'`, `'Interested'`, `'Save'` |
| `created_at` | DATETIME | NOT NULL | Timestamp |
| *Composite* | UNIQUE | `UNIQUE(user_id, event_id, interaction_type)` | Prevents duplicate actions |

---

## 4. Bookings, Payments & Tickets

### `EventRegistrations`
Confirmed reservations and seat allocation.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `registration_id`| INT | PK, Auto Increment | Primary key |
| `user_id` | INT | NOT NULL, FK → `Users(user_id)` | Registered attendee |
| `event_id` | INT | NOT NULL, FK → `Events(event_id)` | Registered event |
| `registration_status`| ENUM | NOT NULL, Default: `'Confirmed'` | `'Pending'`, `'Confirmed'`, `'Cancelled'`, `'Attended'` |
| `registered_at` | DATETIME | NOT NULL | Registration timestamp |
| `cancelled_at` | DATETIME | NULL | Timestamp if cancelled |
| *Composite* | UNIQUE | `UNIQUE(user_id, event_id)` | 1 booking per attendee per event |

### `Payments`
Razorpay Test Mode transaction ledger.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `payment_id` | INT | PK, Auto Increment | Primary key |
| `registration_id`| INT | NOT NULL, FK → `EventRegistrations(registration_id)` | Booking reference |
| `gateway` | VARCHAR(50) | NOT NULL, Default: `'razorpay'` | Payment gateway |
| `gateway_order_id`| VARCHAR(100)| NOT NULL, Indexed | Razorpay order ID (`order_...`) |
| `gateway_payment_id`| VARCHAR(100)| NULL | Razorpay payment ID (`pay_...`) |
| `amount` | DECIMAL(10,2)| NOT NULL | Amount charged |
| `currency` | VARCHAR(5) | NOT NULL, Default: `'INR'` | Currency code |
| `status` | ENUM | NOT NULL, Default: `'Pending'` | `'Pending'`, `'Completed'`, `'Failed'`, `'Refunded'` |
| `payment_mode` | VARCHAR(50) | NULL | Payment method |
| `paid_at` | DATETIME | NULL | Verified completion timestamp |
| `created_at` | DATETIME | NOT NULL | Order initiation timestamp |

### `EventTickets`
Cryptographic digital event passes.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `ticket_id` | INT | PK, Auto Increment | Primary key |
| `registration_id`| INT | NOT NULL, UNIQUE, FK → `EventRegistrations(registration_id)` | 1 ticket per registration |
| `public_ticket_number`| VARCHAR(50)| NOT NULL, UNIQUE | Human-readable pass number (e.g. `MTR-20261026-F12533`) |
| `qr_token_hash` | VARCHAR(64) | NOT NULL | SHA-256 hash of random 32-byte QR token |
| `ticket_status` | ENUM | NOT NULL, Default: `'Valid'` | `'Valid'`, `'Used'`, `'Cancelled'` |
| `issued_at` | DATETIME | NOT NULL | Pass generation timestamp |
| `invalidated_at`| DATETIME | NULL | Pass invalidation timestamp |

### `EventCheckIns`
Atomic gate attendance verification.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `checkin_id` | INT | PK, Auto Increment | Primary key |
| `ticket_id` | INT | NOT NULL, UNIQUE, FK → `EventTickets(ticket_id)` | Verified pass |
| `event_id` | INT | NOT NULL, FK → `Events(event_id)` | Event checked in to |
| `checked_in_by`| INT | NOT NULL, FK → `Users(user_id)` | Organizer who scanned pass |
| `checked_in_at`| DATETIME | NOT NULL | Scan timestamp |

---

## 5. Community Features

### `SecondChanceRequests`
Attendee requests for repeat sessions of past events.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `request_id` | INT | PK, Auto Increment | Primary key |
| `original_event_id`| INT | NOT NULL, FK → `Events(event_id)` | Completed/cancelled event |
| `user_id` | INT | NOT NULL, FK → `Users(user_id)` | Requesting attendee |
| `message` | VARCHAR(255) | NULL | Optional message |
| `created_at` | DATETIME | NOT NULL | Request timestamp |
| *Composite* | UNIQUE | `UNIQUE(original_event_id, user_id)` | 1 request per user per event |

### `SecondChanceResponses`
Organizer status updates on repeat sessions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `response_id` | INT | PK, Auto Increment | Primary key |
| `original_event_id`| INT | NOT NULL, UNIQUE, FK → `Events(event_id)` | Event responded to |
| `organizer_id` | INT | NOT NULL, FK → `Users(user_id)` | Organizer responding |
| `status` | ENUM | NOT NULL | `'Considering'`, `'Planning'`, `'Not Possible'` |
| `response_message`| TEXT | NULL | Note to community requesters |
| `created_at` | DATETIME | NOT NULL | Response timestamp |
| `updated_at` | DATETIME | NOT NULL | Update timestamp |

### `EventDemands`
Community-driven event requests.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `demand_id` | INT | PK, Auto Increment | Primary key |
| `created_by` | INT | NOT NULL, FK → `Users(user_id)` | Requesting user |
| `category_id` | INT | NOT NULL, FK → `Categories(category_id)` | Requested category |
| `title` | VARCHAR(150) | NOT NULL | Requested meetup concept |
| `description` | TEXT | NULL | What attendees hope to experience |
| `city` | VARCHAR(100) | NOT NULL | Requested city |
| `preferred_location`| VARCHAR(150)| NULL | Desired area / venue |
| `preferred_date`| VARCHAR(50) | NULL | Desired timeframe |
| `supporter_count`| INT | NOT NULL, Default: 1 | Number of community upvotes |
| `status` | ENUM | NOT NULL, Default: `'Open'` | `'Open'`, `'Under Review'`, `'Planning'`, `'Fulfilled'` |
| `created_at` | DATETIME | NOT NULL | Submission timestamp |
| `updated_at` | DATETIME | NOT NULL | Status update timestamp |

### `DemandSupporters`
Community upvotes supporting an event request.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `supporter_id` | INT | PK, Auto Increment | Primary key |
| `demand_id` | INT | NOT NULL, FK → `EventDemands(demand_id)` | Supported demand |
| `user_id` | INT | NOT NULL, FK → `Users(user_id)` | Supporter |
| `created_at` | DATETIME | NOT NULL | Vote timestamp |
| *Composite* | UNIQUE | `UNIQUE(demand_id, user_id)` | 1 upvote per user |

### `DemandResponses`
Organizer answers and event creation fulfillment.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `response_id` | INT | PK, Auto Increment | Primary key |
| `demand_id` | INT | NOT NULL, FK → `EventDemands(demand_id)` | Target demand |
| `organizer_id` | INT | NOT NULL, FK → `Users(user_id)` | Responding organizer |
| `response_text`| TEXT | NOT NULL | Organizer message |
| `linked_event_id`| INT | NULL, FK → `Events(event_id)` | Event created to fulfill demand |
| `created_at` | DATETIME | NOT NULL | Response timestamp |

---

## 6. Feedback, Notifications & Moderation

### `Notifications`
In-app notification bell feed for users.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `notification_id`| INT | PK, Auto Increment | Primary key |
| `user_id` | INT | NOT NULL, FK → `Users(user_id)` | Recipient user |
| `notification_type`| ENUM | NOT NULL | `'reminder'`, `'registration_confirmed'`, `'event_update'`, `'second_chance'`, `'demand_response'`, `'system'` |
| `title` | VARCHAR(150) | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Notification body |
| `related_event_id`| INT | NULL, FK → `Events(event_id)` | Optional event link |
| `related_demand_id`| INT | NULL, FK → `EventDemands(demand_id)`| Optional demand link |
| `is_read` | TINYINT(1) | NOT NULL, Default: 0 | Read flag |
| `created_at` | DATETIME | NOT NULL | Delivery timestamp |

### `NotificationDeliveries`
Deduplication ledger for automated background reminders.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `delivery_id` | INT | PK, Auto Increment | Primary key |
| `user_id` | INT | NOT NULL, FK → `Users(user_id)` | Reminded user |
| `event_id` | INT | NOT NULL, FK → `Events(event_id)` | Reminded event |
| `reminder_type` | ENUM | NOT NULL | `'48_hours'`, `'24_hours'`, `'2_hours'`, `'saved_event_upcoming'` |
| `delivered_at` | DATETIME | NOT NULL | Delivery timestamp |
| *Composite* | UNIQUE | `UNIQUE(user_id, event_id, reminder_type)` | Prevents duplicate reminders |

### `EventReviews`
Verified post-attendance ratings and reviews.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `review_id` | INT | PK, Auto Increment | Primary key |
| `event_id` | INT | NOT NULL, FK → `Events(event_id)` | Reviewed event |
| `user_id` | INT | NOT NULL, FK → `Users(user_id)` | Verified attendee |
| `rating` | INT | NOT NULL, CHECK: 1 to 5 | Star score |
| `comment` | TEXT | NULL | Written feedback |
| `created_at` | DATETIME | NOT NULL | Review timestamp |
| `updated_at` | DATETIME | NOT NULL | Edit timestamp |
| *Composite* | UNIQUE | `UNIQUE(event_id, user_id)` | 1 review per attendee |

### `Reports`
Community safety and moderation reports.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `report_id` | INT | PK, Auto Increment | Primary key |
| `reporter_id` | INT | NOT NULL, FK → `Users(user_id)` | Reporting user |
| `target_type` | ENUM | NOT NULL | `'event'`, `'organizer'`, `'user'`, `'review'`, `'demand'` |
| `target_id` | INT | NOT NULL | ID of target entity |
| `reason` | VARCHAR(100) | NOT NULL | Violation category |
| `description` | TEXT | NULL | Additional details |
| `status` | ENUM | NOT NULL, Default: `'pending'` | `'pending'`, `'reviewed'`, `'resolved'`, `'dismissed'` |
| `reviewed_by` | INT | NULL, FK → `Users(user_id)` | Admin reviewing report |
| `reviewed_at` | DATETIME | NULL | Resolution timestamp |
| `created_at` | DATETIME | NOT NULL | Submission timestamp |
| `updated_at` | DATETIME | NOT NULL | Resolution timestamp |

### `EventModeration`
Administrative audit records for event moderation actions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `moderation_id` | INT | PK, Auto Increment | Primary key |
| `event_id` | INT | NOT NULL, FK → `Events(event_id)` | Moderated event |
| `admin_id` | INT | NOT NULL, FK → `Users(user_id)` | Administrator |
| `action` | ENUM | NOT NULL | `'hide'`, `'restore'`, `'flag'` |
| `reason` | TEXT | NOT NULL | Reason for moderation action |
| `created_at` | DATETIME | NOT NULL | Action timestamp |

### `AdminAuditLogs`
Immutable platform governance log.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `audit_id` | INT | PK, Auto Increment | Primary key |
| `admin_id` | INT | NOT NULL, FK → `Users(user_id)` | Acting administrator |
| `action` | VARCHAR(100) | NOT NULL | Action type |
| `target_type` | VARCHAR(50) | NOT NULL | Target entity type |
| `target_id` | INT | NOT NULL | Target entity primary key |
| `reason` | TEXT | NULL | Administrative justification |
| `metadata_json` | JSON | NULL | Contextual snapshot |
| `created_at` | DATETIME | NOT NULL | Audit timestamp |
