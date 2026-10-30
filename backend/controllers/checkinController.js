'use strict';

const { Op } = require('sequelize');
const {
  EventTicket, EventRegistration, EventCheckIn, Event,
  User, Payment, sequelize,
} = require('../models');
const { hashQrToken, verifyTicketQrToken } = require('../utils/ticketQr');

// POST /api/organizer/events/:id/check-in
const checkIn = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const event_id = parseInt(req.params.id);
    const { qr_token } = req.body;

    if (!qr_token) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'QR token is required.' });
    }

    // Verify organizer owns this event
    const ev = await Event.findByPk(event_id, { transaction: t });
    if (!ev || ev.organizer_id !== req.user.user_id) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'You are not authorized to check in for this event.' });
    }

    // Check if event window has closed
    if (ev.status === 'Completed' || (ev.end_datetime && new Date() > new Date(ev.end_datetime))) {
      await t.rollback();
      return res.status(400).json({ success: false, result: 'EVENT_ENDED', message: 'Check-in is closed. This event has already ended.' });
    }

    // New passes are signed and reproducible from the stored ticket issuance time.
    // Keep hash lookup as a compatibility path for passes issued by older versions.
    // Also allow direct manual entry using public ticket number (e.g. MTR-20261027-9C43C8).
    let ticket = null;
    const cleanToken = String(qr_token || '').trim();
    const tokenParts = cleanToken.split(':');
    if (tokenParts[0] === 'MTR1' && /^\d+$/.test(tokenParts[1] || '')) {
      ticket = await EventTicket.findByPk(Number(tokenParts[1]), {
        include: [{
          model: EventRegistration, as: 'registration',
          include: [
            { model: User, as: 'user', attributes: ['name', 'email'] },
            { model: Payment, as: 'payment' },
          ],
        }],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (ticket && (!verifyTicketQrToken(cleanToken, ticket) ||
          hashQrToken(cleanToken) !== ticket.qr_token_hash)) ticket = null;
    } else {
      const scannedHash = hashQrToken(cleanToken);
      ticket = await EventTicket.findOne({
        where: { qr_token_hash: scannedHash },
        include: [{
          model: EventRegistration, as: 'registration',
          include: [
            { model: User, as: 'user', attributes: ['name', 'email'] },
            { model: Payment, as: 'payment' },
          ],
        }],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!ticket) {
        // Fallback: Lookup by public ticket number (e.g. MTR-20261027-9C43C8)
        const normalized = cleanToken.replace(/\s+/g, '').toUpperCase();
        ticket = await EventTicket.findOne({
          where: {
            [Op.or]: [
              { public_ticket_number: cleanToken },
              { public_ticket_number: normalized },
            ],
          },
          include: [{
            model: EventRegistration, as: 'registration',
            include: [
              { model: User, as: 'user', attributes: ['name', 'email'] },
              { model: Payment, as: 'payment' },
            ],
          }],
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
      }
    }

    if (!ticket) {
      await t.rollback();
      return res.status(404).json({ success: false, result: 'INVALID_TICKET', message: 'Invalid ticket number or QR code. Ticket not found.' });
    }

    const reg = ticket.registration;

    // Validate against this event: allow seamless verification if organizer owns the ticket's event
    let targetEvent = ev;
    if (reg.event_id !== event_id) {
      const actualEvent = await Event.findByPk(reg.event_id, { transaction: t });
      if (actualEvent && actualEvent.organizer_id === req.user.user_id) {
        targetEvent = actualEvent;
      } else {
        await t.rollback();
        return res.status(400).json({
          success: false,
          result: 'WRONG_EVENT',
          message: `This ticket is for a different event${actualEvent ? ` ("${actualEvent.title}")` : ''}.`,
        });
      }
    }

    // Check status
    if (ticket.ticket_status === 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ success: false, result: 'CANCELLED_TICKET', message: 'This ticket has been cancelled.' });
    }
    if (reg.registration_status !== 'Confirmed') {
      await t.rollback();
      return res.status(400).json({ success: false, result: 'UNCONFIRMED', message: 'Registration is not confirmed.' });
    }

    // For paid events – verify payment
    if (parseFloat(targetEvent.price) > 0 && (!reg.payment || reg.payment.status !== 'Completed')) {
      await t.rollback();
      return res.status(400).json({ success: false, result: 'PAYMENT_UNVERIFIED', message: 'Payment not verified for this ticket.' });
    }

    // Already checked in?
    const existing = await EventCheckIn.findOne({ where: { ticket_id: ticket.ticket_id }, transaction: t });
    if (existing) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        result: 'ALREADY_CHECKED_IN',
        message: `Already checked in at ${existing.checked_in_at}.`,
        attendee: reg.user?.name,
      });
    }

    // Perform check-in
    await EventCheckIn.create({
      ticket_id: ticket.ticket_id,
      event_id: targetEvent.event_id,
      checked_in_by: req.user.user_id,
    }, { transaction: t });

    ticket.ticket_status = 'Used';
    await ticket.save({ transaction: t });

    await t.commit();

    return res.json({
      success: true,
      result: 'VALID_ENTRY',
      message: 'Entry Allowed ✓',
      attendee: reg.user?.name,
      ticket_number: ticket.public_ticket_number,
      event_id: targetEvent.event_id,
      event_title: targetEvent.title,
    });
  } catch (err) {
    await t.rollback();
    console.error('checkIn error:', err);
    return res.status(500).json({ success: false, message: 'Check-in failed. Please try again.' });
  }
};

// GET /api/organizer/events/:id/attendance
const getAttendance = async (req, res) => {
  try {
    const event_id = parseInt(req.params.id);
    const ev = await Event.findByPk(event_id);
    if (!ev || ev.organizer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const checkins = await EventCheckIn.findAll({
      where: { event_id },
      include: [{
        model: EventTicket, as: 'ticket',
        include: [{
          model: EventRegistration, as: 'registration',
          include: [{ model: User, as: 'user', attributes: ['name', 'email', 'city'] }],
        }],
      }],
      order: [['checked_in_at', 'ASC']],
    });

    return res.json({
      success: true,
      total_checkins: checkins.length,
      attendance: checkins.map(c => ({
        checkin_id: c.checkin_id,
        checked_in_at: c.checked_in_at,
        ticket_number: c.ticket?.public_ticket_number,
        attendee: c.ticket?.registration?.user,
      })),
    });
  } catch (err) {
    console.error('getAttendance error:', err);
    return res.status(500).json({ success: false, message: 'Could not load attendance.' });
  }
};

module.exports = { checkIn, getAttendance };
