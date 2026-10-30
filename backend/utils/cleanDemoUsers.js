'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Event,
  EventRegistration,
  EventTicket,
  Payment,
  Notification,
  EventInteraction,
  EventReview,
  EventCheckIn,
  EventDemand,
  DemandSupporter,
  DemandResponse,
  SecondChanceRequest,
  SecondChanceResponse,
  AdminAuditLog
} = require('../models');

// Canonical baseline accounts that MUST BE PRESERVED
const CANONICAL_EMAILS = [
  'admin@meetior.in',
  'organizer@meetior.in',
  'attendee@meetior.in',
  'rohan.shah@community.in',
  'harshil.mehta@community.in',
  'ananya.joshi@community.in',
  'devansh.trivedi@community.in'
];

async function cleanDemoUsersAndData() {
  console.log('\n============================================================');
  console.log('🧹 MEETIOR GITHUB CLEANER: PURGE DEMO USERS & ORGANIZERS');
  console.log('============================================================');

  const t = await sequelize.transaction();
  try {
    // 1. Find all demo users to remove
    const demoUsers = await User.findAll({
      where: { email: { [Op.notIn]: CANONICAL_EMAILS } },
      attributes: ['user_id', 'name', 'email', 'role'],
      transaction: t
    });

    const demoUserIds = demoUsers.map(u => u.user_id);
    console.log(`🔍 Found ${demoUsers.length} non-canonical demo users/organizers.`);

    // 2. Find events created by demo organizers
    const demoEvents = demoUserIds.length > 0 ? await Event.findAll({
      where: { organizer_id: { [Op.in]: demoUserIds } },
      attributes: ['event_id', 'title', 'organizer_id'],
      transaction: t
    }) : [];

    const demoEventIds = demoEvents.map(e => e.event_id);
    console.log(`🔍 Found ${demoEvents.length} events created by demo organizers.`);

    // 3. Find registrations linked to demo users or demo events
    const regConditions = [];
    if (demoUserIds.length > 0) regConditions.push({ user_id: { [Op.in]: demoUserIds } });
    if (demoEventIds.length > 0) regConditions.push({ event_id: { [Op.in]: demoEventIds } });

    const linkedRegs = regConditions.length > 0 ? await EventRegistration.findAll({
      where: { [Op.or]: regConditions },
      attributes: ['registration_id'],
      transaction: t
    }) : [];
    const linkedRegIds = linkedRegs.map(r => r.registration_id);

    // Find tickets linked to those registrations
    const linkedTickets = linkedRegIds.length > 0 ? await EventTicket.findAll({
      where: { registration_id: { [Op.in]: linkedRegIds } },
      attributes: ['ticket_id'],
      transaction: t
    }) : [];
    const linkedTicketIds = linkedTickets.map(tk => tk.ticket_id);

    // 4. Cascade delete all child associations
    let countPayments = 0;
    let countTickets = 0;
    let countCheckIns = 0;
    let countReviews = 0;
    let countInteractions = 0;
    let countNotifs = 0;

    // Payments
    countPayments = await Payment.destroy({
      where: {
        [Op.or]: [
          { gateway: 'demo_wallet' },
          ...(linkedRegIds.length > 0 ? [{ registration_id: { [Op.in]: linkedRegIds } }] : [])
        ]
      },
      transaction: t
    });

    // Check-ins
    const checkInConditions = [];
    if (linkedTicketIds.length > 0) checkInConditions.push({ ticket_id: { [Op.in]: linkedTicketIds } });
    if (demoEventIds.length > 0) checkInConditions.push({ event_id: { [Op.in]: demoEventIds } });
    if (demoUserIds.length > 0) checkInConditions.push({ checked_in_by: { [Op.in]: demoUserIds } });
    if (checkInConditions.length > 0) {
      countCheckIns = await EventCheckIn.destroy({
        where: { [Op.or]: checkInConditions },
        transaction: t
      });
    }

    // Tickets
    if (linkedRegIds.length > 0) {
      countTickets = await EventTicket.destroy({
        where: { registration_id: { [Op.in]: linkedRegIds } },
        transaction: t
      });
    }

    // Registrations
    let countRegs = 0;
    if (linkedRegIds.length > 0) {
      countRegs = await EventRegistration.destroy({
        where: { registration_id: { [Op.in]: linkedRegIds } },
        transaction: t
      });
    }

    // Reviews
    const revConditions = [];
    if (demoUserIds.length > 0) revConditions.push({ user_id: { [Op.in]: demoUserIds } });
    if (demoEventIds.length > 0) revConditions.push({ event_id: { [Op.in]: demoEventIds } });
    if (revConditions.length > 0) {
      countReviews = await EventReview.destroy({
        where: { [Op.or]: revConditions },
        transaction: t
      });
    }

    // Interactions
    const intConditions = [];
    if (demoUserIds.length > 0) intConditions.push({ user_id: { [Op.in]: demoUserIds } });
    if (demoEventIds.length > 0) intConditions.push({ event_id: { [Op.in]: demoEventIds } });
    if (intConditions.length > 0) {
      countInteractions = await EventInteraction.destroy({
        where: { [Op.or]: intConditions },
        transaction: t
      });
    }

    // Second Chance
    if (demoEventIds.length > 0) {
      await SecondChanceResponse.destroy({
        where: { original_event_id: { [Op.in]: demoEventIds } },
        transaction: t
      });
      await SecondChanceRequest.destroy({
        where: { original_event_id: { [Op.in]: demoEventIds } },
        transaction: t
      });
    }
    if (demoUserIds.length > 0) {
      await SecondChanceRequest.destroy({
        where: { user_id: { [Op.in]: demoUserIds } },
        transaction: t
      });
    }

    // Demands & Supporters
    if (demoUserIds.length > 0) {
      await DemandSupporter.destroy({
        where: { user_id: { [Op.in]: demoUserIds } },
        transaction: t
      });
      await DemandResponse.destroy({
        where: { organizer_id: { [Op.in]: demoUserIds } },
        transaction: t
      });
      await EventDemand.destroy({
        where: { created_by: { [Op.in]: demoUserIds } },
        transaction: t
      });
    }

    // Notifications
    if (demoUserIds.length > 0) {
      countNotifs = await Notification.destroy({
        where: { user_id: { [Op.in]: demoUserIds } },
        transaction: t
      });
    }

    // 5. Delete events created by demo organizers
    let countEvents = 0;
    if (demoEventIds.length > 0) {
      countEvents = await Event.destroy({
        where: { event_id: { [Op.in]: demoEventIds } },
        transaction: t
      });
    }

    // 6. Delete demo users and organizers
    let countUsers = 0;
    if (demoUserIds.length > 0) {
      countUsers = await User.destroy({
        where: { user_id: { [Op.in]: demoUserIds } },
        transaction: t
      });
    }

    await t.commit();

    console.log('------------------------------------------------------------');
    console.log(`✅ Removed ${countUsers} demo user(s) and organizer(s)`);
    console.log(`✅ Removed ${countEvents} demo event(s)`);
    console.log(`✅ Removed ${countRegs} event registration(s)`);
    console.log(`✅ Removed ${countTickets} event pass ticket(s)`);
    console.log(`✅ Removed ${countPayments} payment record(s)`);
    console.log(`✅ Removed ${countCheckIns} check-in log(s)`);
    console.log(`✅ Removed ${countReviews} review(s) & ${countInteractions} interaction(s)`);
    console.log(`✅ Removed ${countNotifs} notification(s)`);
    console.log('------------------------------------------------------------');
    console.log('🎉 Database is 100% clean, pristine, and ready for GitHub!');
    console.log('============================================================\n');

    return {
      success: true,
      removed_users: countUsers,
      removed_events: countEvents,
      removed_registrations: countRegs,
      removed_tickets: countTickets,
      removed_payments: countPayments,
      removed_checkins: countCheckIns
    };
  } catch (err) {
    await t.rollback();
    console.error('❌ Error during demo data cleanup:', err);
    throw err;
  }
}

if (require.main === module) {
  cleanDemoUsersAndData().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { cleanDemoUsersAndData };
