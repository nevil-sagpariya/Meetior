'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  event_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  organizer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  original_event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'For repeated sessions, points to the original event',
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { len: [3, 150] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  start_datetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_datetime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  registration_deadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'null = unlimited',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  currency: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Published', 'Ongoing', 'Cancelled', 'Completed'),
    allowNull: false,
    defaultValue: 'Published',
  },
  moderation_status: {
    type: DataTypes.ENUM('Approved', 'Hidden', 'UnderReview'),
    allowNull: false,
    defaultValue: 'Approved',
  },
  special_code_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'Events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Event;
