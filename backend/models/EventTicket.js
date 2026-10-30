'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventTicket = sequelize.define('EventTicket', {
  ticket_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  registration_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  public_ticket_number: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  qr_token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  ticket_status: {
    type: DataTypes.ENUM('Valid', 'Used', 'Cancelled', 'Expired'),
    defaultValue: 'Valid',
  },
  issued_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  invalidated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'EventTickets',
  timestamps: false,
});

module.exports = EventTicket;
