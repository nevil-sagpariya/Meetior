'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationDelivery = sequelize.define('NotificationDelivery', {
  delivery_id: {
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
  notification_type: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  reminder_offset: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g. 2d, 1d, 2h',
  },
  scheduled_for: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Delivered', 'Skipped'),
    defaultValue: 'Pending',
  },
  deduplication_key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'user_id:event_id:type:offset',
  },
}, {
  tableName: 'NotificationDeliveries',
  timestamps: false,
});

module.exports = NotificationDelivery;
