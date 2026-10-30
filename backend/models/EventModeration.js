'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventModeration = sequelize.define('EventModeration', {
  moderation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('hide', 'restore', 'flag'),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'EventModeration',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = EventModeration;
