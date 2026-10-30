'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventRegistration = sequelize.define('EventRegistration', {
  registration_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  registration_status: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  registered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'EventRegistrations',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'event_id'],
    },
  ],
});

module.exports = EventRegistration;
