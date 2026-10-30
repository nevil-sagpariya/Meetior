'use strict';
require('dotenv').config();
const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('🚀 Running 002_super_admin_system database migration...');

    // 1. Users table updates
    // Add admin_role column to Users
    const [userAdminRole] = await sequelize.query("SHOW COLUMNS FROM Users LIKE 'admin_role'");
    if (userAdminRole.length === 0) {
      await sequelize.query(`
        ALTER TABLE Users ADD COLUMN admin_role ENUM('Super Admin', 'Event Moderator', 'Support Admin', 'Finance Admin') 
        NOT NULL DEFAULT 'Super Admin' AFTER role
      `);
      console.log('✅ Users admin_role column added.');
    } else {
      console.log('ℹ️ Users admin_role column already exists.');
    }

    // Add mfa_enabled and mfa_secret to Users
    const [userMfaEnabled] = await sequelize.query("SHOW COLUMNS FROM Users LIKE 'mfa_enabled'");
    if (userMfaEnabled.length === 0) {
      await sequelize.query(`
        ALTER TABLE Users ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER admin_role,
        ADD COLUMN mfa_secret VARCHAR(255) NULL AFTER mfa_enabled,
        ADD COLUMN last_login_at DATETIME NULL AFTER mfa_secret
      `);
      console.log('✅ Users MFA and last_login_at columns added.');
    } else {
      console.log('ℹ️ Users MFA columns already exist.');
    }

    // 2. EventReviews table updates
    // Add status column to EventReviews for moderation (approved, flagged, hidden)
    const [reviewCols] = await sequelize.query("SHOW COLUMNS FROM EventReviews LIKE 'status'");
    if (reviewCols.length === 0) {
      await sequelize.query(`
        ALTER TABLE EventReviews ADD COLUMN status ENUM('approved', 'flagged', 'hidden') 
        NOT NULL DEFAULT 'approved' AFTER comment
      `);
      console.log('✅ EventReviews status column added.');
    } else {
      console.log('ℹ️ EventReviews status column already exists.');
    }

    // 3. AdminAuditLogs table updates
    // Add ip_address column to AdminAuditLogs
    const [auditIp] = await sequelize.query("SHOW COLUMNS FROM AdminAuditLogs LIKE 'ip_address'");
    if (auditIp.length === 0) {
      await sequelize.query("ALTER TABLE AdminAuditLogs ADD COLUMN ip_address VARCHAR(45) NULL AFTER metadata_json");
      console.log('✅ AdminAuditLogs ip_address column added.');
    } else {
      console.log('ℹ️ AdminAuditLogs ip_address column already exists.');
    }

    // 4. Create PlatformSettings table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS PlatformSettings (
        setting_id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'system',
        description VARCHAR(255) NULL,
        updated_by INT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES Users(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ PlatformSettings table verified/created.');

    // Seed default PlatformSettings
    const defaultSettings = [
      { key: 'platform_commission_percent', value: '5.0', cat: 'finance', desc: 'Platform service commission charged on paid bookings (%)' },
      { key: 'commission_mode', value: 'percentage', cat: 'finance', desc: 'Commission model (percentage or flat)' },
      { key: 'payout_integration_status', value: 'Not Configured (Simulated / Razorpay Sandbox)', cat: 'finance', desc: 'Current automated bank payout integration status' },
      { key: 'sandbox_mode', value: 'true', cat: 'finance', desc: 'Whether payment gateway operates in Sandbox/Test Mode' },
      { key: 'review_policy', value: 'verified_attendees_only', cat: 'moderation', desc: 'Policy for submitting event reviews' },
      { key: 'auto_approve_events', value: 'true', cat: 'moderation', desc: 'Whether newly created events are auto-approved' },
      { key: 'currency_code', value: 'INR', cat: 'finance', desc: 'Default currency symbol and code' },
      { key: 'max_booking_cancellation_hours', value: '24', cat: 'policy', desc: 'Cancellation cutoff window in hours before event start' },
    ];

    for (const s of defaultSettings) {
      const [existing] = await sequelize.query("SELECT setting_id FROM PlatformSettings WHERE setting_key = ?", {
        replacements: [s.key]
      });
      if (existing.length === 0) {
        await sequelize.query(
          "INSERT INTO PlatformSettings (setting_key, setting_value, category, description, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
          { replacements: [s.key, s.value, s.cat, s.desc] }
        );
      }
    }
    console.log('✅ Default PlatformSettings seeded.');

    // 5. Create AdminRolePermissions table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS AdminRolePermissions (
        permission_id INT AUTO_INCREMENT PRIMARY KEY,
        role_name ENUM('Super Admin', 'Event Moderator', 'Support Admin', 'Finance Admin') NOT NULL,
        permission_key VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_role_permission (role_name, permission_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ AdminRolePermissions table verified/created.');

    // Seed standard role permissions
    const standardPermissions = [
      // Super Admin: all permissions
      { role: 'Super Admin', perm: '*', desc: 'Full administrative access and governance' },
      
      // Event Moderator
      { role: 'Event Moderator', perm: 'events:read', desc: 'View all events' },
      { role: 'Event Moderator', perm: 'events:moderate', desc: 'Approve, hide, or restore events' },
      { role: 'Event Moderator', perm: 'reports:read', desc: 'View content reports' },
      { role: 'Event Moderator', perm: 'reports:resolve', desc: 'Resolve or dismiss reports' },
      { role: 'Event Moderator', perm: 'reviews:read', desc: 'View attendee reviews' },
      { role: 'Event Moderator', perm: 'reviews:moderate', desc: 'Flag or hide abusive reviews' },
      { role: 'Event Moderator', perm: 'categories:manage', desc: 'Create and manage event categories' },
      { role: 'Event Moderator', perm: 'attendance:read', desc: 'Inspect attendance reports' },

      // Support Admin
      { role: 'Support Admin', perm: 'users:read', desc: 'View attendee and organizer profiles' },
      { role: 'Support Admin', perm: 'users:moderate', desc: 'Suspend or reactivate accounts' },
      { role: 'Support Admin', perm: 'reports:read', desc: 'View user complaints and reports' },
      { role: 'Support Admin', perm: 'reports:resolve', desc: 'Resolve user tickets' },
      { role: 'Support Admin', perm: 'audit:read', desc: 'Read audit trails' },

      // Finance Admin
      { role: 'Finance Admin', perm: 'finance:read', desc: 'View platform revenue and financial reports' },
      { role: 'Finance Admin', perm: 'finance:export', desc: 'Export revenue and earnings spreadsheets' },
      { role: 'Finance Admin', perm: 'payments:read', desc: 'Inspect payment transactions and refunds' },
      { role: 'Finance Admin', perm: 'organizers:earnings', desc: 'View organizer net earnings breakdowns' },
      { role: 'Finance Admin', perm: 'settings:read', desc: 'View financial platform settings' }
    ];

    for (const p of standardPermissions) {
      const [existing] = await sequelize.query(
        "SELECT permission_id FROM AdminRolePermissions WHERE role_name = ? AND permission_key = ?",
        { replacements: [p.role, p.perm] }
      );
      if (existing.length === 0) {
        await sequelize.query(
          "INSERT INTO AdminRolePermissions (role_name, permission_key, description, created_at) VALUES (?, ?, ?, NOW())",
          { replacements: [p.role, p.perm, p.desc] }
        );
      }
    }
    console.log('✅ AdminRolePermissions seeded.');

    // 6. Ensure default admin user has admin_role = 'Super Admin'
    await sequelize.query("UPDATE Users SET admin_role = 'Super Admin' WHERE role = 'Admin'");
    console.log('✅ Admin accounts updated with Super Admin role.');

    console.log('🎉 Super Admin System database migrations completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate().then(() => process.exit(0));
