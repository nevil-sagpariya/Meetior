'use strict';
require('dotenv').config();
const sequelize = require('../config/database');

async function migrate() {
  try {
    // 1. Update Users table role enum to include Admin
    await sequelize.query("ALTER TABLE Users MODIFY COLUMN role ENUM('Attendee', 'Organizer', 'Admin') NOT NULL DEFAULT 'Attendee'");
    console.log('✅ Users role ENUM updated.');

    // 2. Add account_status column to Users if not present
    const [userCols] = await sequelize.query("SHOW COLUMNS FROM Users LIKE 'account_status'");
    if (userCols.length === 0) {
      await sequelize.query("ALTER TABLE Users ADD COLUMN account_status ENUM('active', 'suspended') NOT NULL DEFAULT 'active' AFTER role");
      console.log('✅ Users account_status column added.');
    } else {
      console.log('ℹ️ Users account_status column already exists.');
    }

    // 3. Add moderation_status column to Events if not present
    const [eventCols] = await sequelize.query("SHOW COLUMNS FROM Events LIKE 'moderation_status'");
    if (eventCols.length === 0) {
      await sequelize.query("ALTER TABLE Events ADD COLUMN moderation_status ENUM('Approved', 'Hidden', 'UnderReview') NOT NULL DEFAULT 'Approved' AFTER status");
      console.log('✅ Events moderation_status column added.');
    } else {
      console.log('ℹ️ Events moderation_status column already exists.');
    }

    // 4. Create Reports table if not present
    await sequelize.query(`
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
        FOREIGN KEY (reporter_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES Users(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Reports table verified/created.');

    // 5. Create EventModeration table if not present
    await sequelize.query(`
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
    `);
    console.log('✅ EventModeration table verified/created.');

    // 6. Create AdminAuditLogs table if not present
    await sequelize.query(`
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
    `);
    console.log('✅ AdminAuditLogs table verified/created.');

    console.log('🎉 Database migrations finished cleanly without data loss!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate().then(() => process.exit(0));
