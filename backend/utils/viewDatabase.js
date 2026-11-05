'use strict';

require('dotenv').config();
const { sequelize } = require('../models');

async function displayDatabase() {
  try {
    await sequelize.authenticate();
    console.log('\n' + '='.repeat(78));
    console.log('   🎨 MEETIOR LIVE MYSQL DATABASE VIEWER (meetior_db)');
    console.log('='.repeat(78));

    // 1. Users Table
    const [users] = await sequelize.query(`
      SELECT user_id AS ID, name AS Name, email AS Email, role AS Role, city AS City, account_status AS Status
      FROM users
      ORDER BY user_id ASC
      LIMIT 10;
    `);
    console.log('\n📋 1. USERS TABLE:');
    console.table(users);

    // 2. Events Table (joined with locations for City & Venue)
    const [events] = await sequelize.query(`
      SELECT 
        e.event_id AS ID, 
        LEFT(e.title, 28) AS Title, 
        COALESCE(l.city, 'All India') AS City, 
        CONCAT('₹', e.price) AS Price, 
        COALESCE(e.capacity, 'Open') AS Capacity, 
        e.status AS Status
      FROM events e
      LEFT JOIN locations l ON e.location_id = l.location_id
      ORDER BY e.event_id ASC
      LIMIT 12;
    `);
    console.log('\n🎉 2. EVENTS TABLE (Live Listings):');
    console.table(events);

    // 3. Registrations & Payments
    const [payments] = await sequelize.query(`
      SELECT 
        p.payment_id AS ID, 
        p.registration_id AS Reg_ID, 
        CONCAT('₹', p.amount) AS Amount, 
        COALESCE(p.payment_mode, p.gateway) AS Mode, 
        p.status AS Status, 
        DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS Date
      FROM payments p
      ORDER BY p.payment_id DESC
      LIMIT 6;
    `);
    console.log('\n💳 3. PAYMENTS & TRANSACTIONS TABLE:');
    if (payments.length > 0) {
      console.table(payments);
    } else {
      console.log('   (No payments in current baseline)');
    }

    // 4. Summary counts
    const [counts] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) AS Total_Users,
        (SELECT COUNT(*) FROM events) AS Total_Events,
        (SELECT COUNT(*) FROM eventregistrations) AS Total_Registrations,
        (SELECT COUNT(*) FROM payments) AS Total_Payments,
        (SELECT COUNT(*) FROM eventdemands) AS Community_Demands
    `);
    console.log('\n📊 4. DATABASE METRICS SUMMARY:');
    console.table(counts);

    console.log('='.repeat(78) + '\n');
  } catch (err) {
    console.error('Database connection error:', err.message);
  } finally {
    await sequelize.close();
  }
}

displayDatabase();
