'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SecondChanceRequest = sequelize.define('SecondChanceRequest', {
  request_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  original_event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'SecondChanceRequests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['original_event_id', 'user_id'],
    },
  ],
});

module.exports = SecondChanceRequest;
