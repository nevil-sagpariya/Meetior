'use strict';
require('dotenv').config();
const { Op } = require('sequelize');
const {
  User,
  Event,
  EventRegistration,
  EventTicket,
  Payment,
  Notification,
  EventInteraction,
  EventReview
} = require('../models');

// Baseline initial registration IDs that belong to the core seeded demo data
const BASELINE_REGISTRATION_IDS = [1, 3, 6, 13, 19, 20, 22, 25, 27, 31, 42, 108];

async function cleanupTestData() {
  console.log('\n🧹 Meetior Database Test Cleaner');
  console.log('====================================================');
  try {
    // 1. Find all temporary registrations added during testing
    const testRegs = await EventRegistration.findAll({
      where: {
        registration_id: { [Op.notIn]: BASELINE_REGISTRATION_IDS }
      }
    });

    const testRegIds = testRegs.map(r => r.registration_id);
    let deletedPayments = 0;
    let deletedTickets = 0;
    let deletedRegs = 0;
    let deletedNotifs = 0;

    // Delete test payments (including all demo_wallet payments)
    deletedPayments = await Payment.destroy({
      where: {
        [Op.or]: [
          { gateway: 'demo_wallet' },
          ...(testRegIds.length > 0 ? [{ registration_id: { [Op.in]: testRegIds } }] : [])
        ]
      }
    });

    // Delete tickets generated for test registrations
    if (testRegIds.length > 0) {
      deletedTickets = await EventTicket.destroy({
        where: { registration_id: { [Op.in]: testRegIds } }
      });

      deletedRegs = await EventRegistration.destroy({
        where: { registration_id: { [Op.in]: testRegIds } }
      });
    }

    // Delete test confirmation notifications for attendee
    deletedNotifs = await Notification.destroy({
      where: {
        title: 'Payment Confirmed! 🎉',
        created_at: { [Op.gte]: new Date('2026-10-30T00:00:00Z') }
      }
    });

    // 2. Remove any test users if created with target test emails
    const targetEmails = ['kavya.test@example.com', 'vikram.events@example.com'];
    const testUsers = await User.findAll({ where: { email: targetEmails } });
    const userIds = testUsers.map(u => u.user_id);

    if (userIds.length > 0) {
      await EventRegistration.destroy({ where: { user_id: userIds } });
      await EventInteraction.destroy({ where: { user_id: userIds } });
      await EventReview.destroy({ where: { user_id: userIds } });
      await User.destroy({ where: { user_id: userIds } });
    }

    console.log(`✅ Removed ${deletedRegs} test event registration(s)`);
    console.log(`✅ Removed ${deletedTickets} test event pass ticket(s)`);
    console.log(`✅ Removed ${deletedPayments} test payment record(s)`);
    console.log(`✅ Removed ${deletedNotifs} test notification(s)`);
    if (userIds.length > 0) console.log(`✅ Removed ${userIds.length} test user account(s)`);
    console.log('----------------------------------------------------');
    console.log('🎉 Database is 100% clean and restored to baseline!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Error during test data cleanup:', err.message);
  }
}

if (require.main === module) {
  cleanupTestData().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { cleanupTestData };
