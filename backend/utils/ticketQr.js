'use strict';

const crypto = require('crypto');

const stableTime = (value) => new Date(value).toISOString();

const createTicketQrToken = (ticket) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured to create secure event passes.');
  const issuedAt = stableTime(ticket.issued_at);
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(`meetior-ticket:${ticket.ticket_id}:${issuedAt}`).digest('hex');
  return `MTR1:${ticket.ticket_id}:${issuedAt}:${signature}`;
};

const hashQrToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyTicketQrToken = (token, ticket) => {
  try {
    const expectedToken = createTicketQrToken(ticket);
    const expectedHash = Buffer.from(hashQrToken(expectedToken), 'hex');
    const receivedHash = Buffer.from(hashQrToken(String(token)), 'hex');
    return expectedHash.length === receivedHash.length && crypto.timingSafeEqual(expectedHash, receivedHash);
  } catch (_) {
    return false;
  }
};

module.exports = { createTicketQrToken, hashQrToken, verifyTicketQrToken };
