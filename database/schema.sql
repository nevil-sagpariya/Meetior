-- ============================================================
-- MEETIOR — MySQL Relational Database Schema
-- Database Name: meetior_db
-- Dialect: MySQL 8.0+
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS meetior_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE meetior_db;

-- ------------------------------------------------------------
-- 1. Administrative Geography: States (All 28 States + 8 UTs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS States (
  state_id INT AUTO_INCREMENT PRIMARY KEY,
  state_name VARCHAR(100) NOT NULL UNIQUE,
  state_code VARCHAR(10) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Administrative Geography: Districts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Districts (
  district_id INT AUTO_INCREMENT PRIMARY KEY,
  state_id INT NOT NULL,
  district_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_state_district (state_id, district_name),
  FOREIGN KEY (state_id) REFERENCES States(state_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Administrative Geography: Cities, Towns & Localities
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Cities (
  city_id INT AUTO_INCREMENT PRIMARY KEY,
  district_id INT NOT NULL,
  city_name VARCHAR(100) NOT NULL,
  city_type ENUM('Tier-1', 'Tier-2', 'Tier-3', 'Town', 'Locality') NOT NULL DEFAULT 'Town',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cities_district (district_id),
  INDEX idx_cities_name (city_name),
  FOREIGN KEY (district_id) REFERENCES Districts(district_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Administrative Geography: Postal Codes (PIN Codes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS PostalCodes (
  postal_code_id INT AUTO_INCREMENT PRIMARY KEY,
  pincode VARCHAR(6) NOT NULL,
  state_id INT NOT NULL,
  district_id INT NOT NULL,
  city_id INT NULL,
  post_office_name VARCHAR(150) NOT NULL,
  locality_name VARCHAR(150) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_postalcodes_pincode (pincode),
  FOREIGN KEY (state_id) REFERENCES States(state_id) ON DELETE CASCADE,
  FOREIGN KEY (district_id) REFERENCES Districts(district_id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES Cities(city_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. Users (Attendees, Organizers, Administrators)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Attendee', 'Organizer', 'Admin') NOT NULL DEFAULT 'Attendee',
  account_status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  profile_image VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  pincode VARCHAR(10) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. Event Categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(20) NOT NULL DEFAULT '🎪',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. Event Venues & Physical Locations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Locations (
  location_id INT AUTO_INCREMENT PRIMARY KEY,
  venue_name VARCHAR(150) NOT NULL,
  formatted_address VARCHAR(255) NOT NULL,
  locality VARCHAR(100) NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  discovery_city VARCHAR(100) NULL,
  postal_code VARCHAR(10) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_locations_city (city),
  INDEX idx_locations_discovery_city (discovery_city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. Events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  organizer_id INT NOT NULL,
  category_id INT NOT NULL,
  location_id INT NOT NULL,
  original_event_id INT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NULL,
  registration_deadline DATETIME NULL,
  capacity INT NOT NULL DEFAULT 50,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(5) NOT NULL DEFAULT 'INR',
  status ENUM('Draft', 'Published', 'Ongoing', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Published',
  moderation_status ENUM('Approved', 'Hidden', 'UnderReview') NOT NULL DEFAULT 'Approved',
  special_code_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_organizer (organizer_id),
  INDEX idx_events_category (category_id),
  INDEX idx_events_location (location_id),
  INDEX idx_events_status (status),
  INDEX idx_events_moderation (moderation_status),
  INDEX idx_events_start_datetime (start_datetime),
  FOREIGN KEY (organizer_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id) REFERENCES Locations(location_id) ON DELETE RESTRICT,
  FOREIGN KEY (original_event_id) REFERENCES Events(event_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. Event Images (Original Local File Uploads)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventImages (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. Event Interactions (Going, Interested, Saved)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventInteractions (
  interaction_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  interaction_type ENUM('Going', 'Interested', 'Save') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_event_interaction (user_id, event_id, interaction_type),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. Event Registrations (Booking Records)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventRegistrations (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  registration_status ENUM('Pending', 'Confirmed', 'Cancelled', 'Attended') NOT NULL DEFAULT 'Confirmed',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME NULL,
  UNIQUE KEY uq_user_event_registration (user_id, event_id),
  INDEX idx_registrations_user (user_id),
  INDEX idx_registrations_event (event_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. Payments (Razorpay Test Mode Ledger)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  gateway_order_id VARCHAR(100) NOT NULL,
  gateway_payment_id VARCHAR(100) NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(5) NOT NULL DEFAULT 'INR',
  status ENUM('Pending', 'Completed', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
  payment_mode VARCHAR(50) NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_order (gateway_order_id),
  INDEX idx_payments_registration (registration_id),
  FOREIGN KEY (registration_id) REFERENCES EventRegistrations(registration_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. Digital Event Tickets (Cryptographic Passes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventTickets (
  ticket_id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL UNIQUE,
  public_ticket_number VARCHAR(50) NOT NULL UNIQUE,
  qr_token_hash VARCHAR(64) NOT NULL,
  ticket_status ENUM('Valid', 'Used', 'Cancelled') NOT NULL DEFAULT 'Valid',
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  invalidated_at DATETIME NULL,
  FOREIGN KEY (registration_id) REFERENCES EventRegistrations(registration_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 14. Event Check-Ins (Atomic Attendance Verification)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventCheckIns (
  checkin_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL UNIQUE,
  event_id INT NOT NULL,
  checked_in_by INT NOT NULL,
  checked_in_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES EventTickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES Users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. Motion Second Chance: Requests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SecondChanceRequests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  original_event_id INT NOT NULL,
  user_id INT NOT NULL,
  message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_secondchance_user_event (original_event_id, user_id),
  FOREIGN KEY (original_event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 16. Motion Second Chance: Organizer Responses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SecondChanceResponses (
  response_id INT AUTO_INCREMENT PRIMARY KEY,
  original_event_id INT NOT NULL UNIQUE,
  organizer_id INT NOT NULL,
  status ENUM('Considering', 'Planning', 'Not Possible') NOT NULL,
  response_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (original_event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (organizer_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 17. Community Demand Engine: Event Demands
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventDemands (
  demand_id INT AUTO_INCREMENT PRIMARY KEY,
  created_by INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  city VARCHAR(100) NOT NULL,
  preferred_location VARCHAR(150) NULL,
  preferred_date VARCHAR(50) NULL,
  supporter_count INT NOT NULL DEFAULT 1,
  status ENUM('Open', 'Under Review', 'Planning', 'Fulfilled') NOT NULL DEFAULT 'Open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 18. Community Demand Engine: Supporters (Upvotes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DemandSupporters (
  supporter_id INT AUTO_INCREMENT PRIMARY KEY,
  demand_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_demand_supporter (demand_id, user_id),
  FOREIGN KEY (demand_id) REFERENCES EventDemands(demand_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 19. Community Demand Engine: Organizer Responses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DemandResponses (
  response_id INT AUTO_INCREMENT PRIMARY KEY,
  demand_id INT NOT NULL,
  organizer_id INT NOT NULL,
  response_text TEXT NOT NULL,
  linked_event_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demand_id) REFERENCES EventDemands(demand_id) ON DELETE CASCADE,
  FOREIGN KEY (organizer_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (linked_event_id) REFERENCES Events(event_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 20. In-App Notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  notification_type ENUM('reminder', 'registration_confirmed', 'event_update', 'second_chance', 'demand_response', 'system') NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  related_event_id INT NULL,
  related_demand_id INT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_read (user_id, is_read),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (related_event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (related_demand_id) REFERENCES EventDemands(demand_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 21. Automatic Notification Deliveries (Scheduler Ledger)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS NotificationDeliveries (
  delivery_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  reminder_type ENUM('48_hours', '24_hours', '2_hours', 'saved_event_upcoming') NOT NULL,
  delivered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_delivery (user_id, event_id, reminder_type),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 22. Verified Event Reviews (Post-Attendance Feedback)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventReviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_event_review (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 23. Reports (Community Content & Safety Reports)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,
  target_type ENUM('event', 'organizer', 'user', 'review', 'demand') NOT NULL,
  target_id INT NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT NULL,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reports_status (status),
  FOREIGN KEY (reporter_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES Users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 24. Event Moderation (Admin Action Log)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EventModeration (
  moderation_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('hide', 'restore', 'flag') NOT NULL,
  reason TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 25. Admin Audit Logs (Immutable Governance Ledger)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS AdminAuditLogs (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INT NOT NULL,
  reason TEXT NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
