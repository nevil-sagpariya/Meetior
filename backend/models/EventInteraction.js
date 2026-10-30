'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventInteraction = sequelize.define('EventInteraction', {
  interaction_id: {
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
  interaction_type: {
    type: DataTypes.ENUM('Going', 'Interested', 'Saved'),
    allowNull: false,
  },
}, {
  tableName: 'EventInteractions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'event_id', 'interaction_type'],
    },
  ],
});

module.exports = EventInteraction;
