'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventCheckIn = sequelize.define('EventCheckIn', {
  checkin_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  checked_in_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  checked_in_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'EventCheckIns',
  timestamps: false,
});

module.exports = EventCheckIn;
