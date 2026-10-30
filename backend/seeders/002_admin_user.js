'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

async function seedAdmin() {
  try {
    const [existing] = await sequelize.query("SELECT * FROM Users WHERE email = 'admin@meetior.in'");
    if (existing.length === 0) {
      const hash = await bcrypt.hash('Admin@123', 10);
      await sequelize.query(`
        INSERT INTO Users (name, email, password_hash, role, account_status, city, district, state, created_at, updated_at)
        VALUES ('Meetior Administrator', 'admin@meetior.in', '${hash}', 'Admin', 'active', 'Ahmedabad', 'Ahmedabad', 'Gujarat', NOW(), NOW())
      `);
      console.log('✅ Admin user seeded: admin@meetior.in / Admin@123');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }
  } catch (err) {
    console.error('Seed admin error:', err);
    process.exit(1);
  }
}

seedAdmin().then(() => process.exit(0));
