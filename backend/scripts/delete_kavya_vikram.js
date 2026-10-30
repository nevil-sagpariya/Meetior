const {
  sequelize, User, Event, EventImage, EventInteraction, EventRegistration,
  Payment, EventTicket, EventCheckIn, SecondChanceRequest, SecondChanceResponse,
  EventDemand, DemandSupporter, DemandResponse, Notification, NotificationDelivery,
  EventReview, Report, EventModeration, Location
} = require('../models');
const { Op } = require('sequelize');

(async () => {
  const t = await sequelize.transaction();
  try {
    // 1. Identify users matching Kavya or Vikram
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%kavya%' } },
          { name: { [Op.like]: '%vikram%' } },
          { email: { [Op.like]: '%kavya%' } },
          { email: { [Op.like]: '%vikram%' } }
        ]
      },
      transaction: t
    });

    const userIds = users.map(u => u.user_id);
    console.log('Target User IDs to remove:', userIds, users.map(u => `${u.name} (${u.email})`));

    if (userIds.length === 0) {
      console.log('No matching users found.');
      await t.rollback();
      process.exit(0);
    }

    // 2. Identify events organized by these users
    const events = await Event.findAll({
      where: { organizer_id: userIds },
      transaction: t
    });
    const eventIds = events.map(e => e.event_id);
    const locationIds = events.map(e => e.location_id).filter(Boolean);
    console.log('Target Events organized by these users:', eventIds, events.map(e => e.title));

    // 3. Identify all registrations by these users OR on their events
    const registrations = await EventRegistration.findAll({
      where: {
        [Op.or]: [
          { user_id: userIds },
          ...(eventIds.length ? [{ event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    const regIds = registrations.map(r => r.registration_id);
    console.log('Target Registrations to remove:', regIds.length);

    // 4. Identify all tickets associated with these registrations
    const tickets = regIds.length ? await EventTicket.findAll({
      where: { registration_id: regIds },
      transaction: t
    }) : [];
    const ticketIds = tickets.map(tk => tk.ticket_id);
    console.log('Target Tickets to remove:', ticketIds.length);

    // 5. Delete CheckIns
    if (ticketIds.length || eventIds.length) {
      const deletedCheckIns = await EventCheckIn.destroy({
        where: {
          [Op.or]: [
            ...(ticketIds.length ? [{ ticket_id: ticketIds }] : []),
            ...(eventIds.length ? [{ event_id: eventIds }] : [])
          ]
        },
        transaction: t
      });
      console.log('Deleted CheckIns:', deletedCheckIns);
    }

    // 6. Delete Payments (linked via registration_id)
    if (regIds.length) {
      const deletedPayments = await Payment.destroy({
        where: { registration_id: regIds },
        transaction: t
      });
      console.log('Deleted Payments:', deletedPayments);
    }

    // 7. Delete Tickets
    if (regIds.length) {
      const deletedTickets = await EventTicket.destroy({
        where: { registration_id: regIds },
        transaction: t
      });
      console.log('Deleted Tickets:', deletedTickets);
    }

    // 8. Delete NotificationDeliveries
    const deletedDeliveries = await NotificationDelivery.destroy({
      where: {
        [Op.or]: [
          { user_id: userIds },
          ...(eventIds.length ? [{ event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    console.log('Deleted NotificationDeliveries:', deletedDeliveries);

    // 9. Delete Notifications
    const deletedNotifications = await Notification.destroy({
      where: {
        [Op.or]: [
          { user_id: userIds },
          ...(eventIds.length ? [{ related_event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    console.log('Deleted Notifications:', deletedNotifications);

    // 10. Delete Demand Responses & Supporters & Demands
    const demands = await EventDemand.findAll({
      where: {
        [Op.or]: [
          { created_by: userIds },
          ...(eventIds.length ? [{ linked_event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    const demandIds = demands.map(d => d.demand_id);

    const deletedDemandResponses = await DemandResponse.destroy({
      where: {
        [Op.or]: [
          { organizer_id: userIds },
          ...(demandIds.length ? [{ demand_id: demandIds }] : []),
          ...(eventIds.length ? [{ linked_event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    console.log('Deleted DemandResponses:', deletedDemandResponses);

    const deletedDemandSupporters = await DemandSupporter.destroy({
      where: {
        [Op.or]: [
          { user_id: userIds },
          ...(demandIds.length ? [{ demand_id: demandIds }] : [])
        ]
      },
      transaction: t
    });
    console.log('Deleted DemandSupporters:', deletedDemandSupporters);

    if (demandIds.length) {
      const deletedDemands = await EventDemand.destroy({
        where: { demand_id: demandIds },
        transaction: t
      });
      console.log('Deleted EventDemands:', deletedDemands);
    }

    // 11. Delete SecondChance Requests & Responses
    const deletedSecondResponses = await SecondChanceResponse.destroy({
      where: {
        [Op.or]: [
          { organizer_id: userIds },
          ...(eventIds.length ? [{ original_event_id: eventIds }] : []),
          ...(eventIds.length ? [{ new_session_event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    console.log('Deleted SecondChanceResponses:', deletedSecondResponses);

    const deletedSecondRequests = await SecondChanceRequest.destroy({
      where: {
        [Op.or]: [
          { user_id: userIds },
          ...(eventIds.length ? [{ original_event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    console.log('Deleted SecondChanceRequests:', deletedSecondRequests);

    // 12. Delete Moderation & Reports
    if (eventIds.length || userIds.length) {
      const deletedModeration = await EventModeration.destroy({
        where: {
          [Op.or]: [
            { admin_id: userIds },
            ...(eventIds.length ? [{ event_id: eventIds }] : [])
          ]
        },
        transaction: t
      });
      console.log('Deleted EventModeration:', deletedModeration);

      const deletedReports = await Report.destroy({
        where: {
          [Op.or]: [
            { reporter_id: userIds },
            ...(eventIds.length ? [{ target_type: 'event', target_id: eventIds }] : [])
          ]
        },
        transaction: t
      });
      console.log('Deleted Reports:', deletedReports);
    }

    // 13. Delete Reviews
    const deletedReviews = await EventReview.destroy({
      where: {
        [Op.or]: [
          { user_id: userIds },
          ...(eventIds.length ? [{ event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    console.log('Deleted Reviews:', deletedReviews);

    // 14. Delete Interactions (Bookmarks, Views)
    const deletedInteractions = await EventInteraction.destroy({
      where: {
        [Op.or]: [
          { user_id: userIds },
          ...(eventIds.length ? [{ event_id: eventIds }] : [])
        ]
      },
      transaction: t
    });
    console.log('Deleted Interactions:', deletedInteractions);

    // 15. Delete Event Registrations
    if (regIds.length) {
      const deletedRegs = await EventRegistration.destroy({
        where: { registration_id: regIds },
        transaction: t
      });
      console.log('Deleted EventRegistrations:', deletedRegs);
    }

    // 16. Delete Event Images
    if (eventIds.length) {
      const deletedImages = await EventImage.destroy({
        where: { event_id: eventIds },
        transaction: t
      });
      console.log('Deleted EventImages:', deletedImages);
    }

    // 17. Delete Events
    if (eventIds.length) {
      const deletedEvents = await Event.destroy({
        where: { event_id: eventIds },
        transaction: t
      });
      console.log('Deleted Events:', deletedEvents);
    }

    // 18. Delete Orphaned Locations if not used by any other event
    if (locationIds.length) {
      for (const locId of locationIds) {
        const otherEvents = await Event.count({
          where: { location_id: locId },
          transaction: t
        });
        if (otherEvents === 0) {
          await Location.destroy({ where: { location_id: locId }, transaction: t });
          console.log('Deleted orphaned Location:', locId);
        }
      }
    }

    // 19. Finally, Delete Users
    const deletedUsers = await User.destroy({
      where: { user_id: userIds },
      transaction: t
    });
    console.log('Deleted Users count:', deletedUsers);

    await t.commit();
    console.log('SUCCESS: Kavya, Vikram, and all associated data successfully removed from database.');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Error during deletion transaction:', err);
    process.exit(1);
  }
})();
