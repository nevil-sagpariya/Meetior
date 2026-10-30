'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  report_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reporter_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  target_type: {
    type: DataTypes.ENUM('event', 'organizer', 'user', 'review', 'demand'),
    allowNull: false,
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Report;
