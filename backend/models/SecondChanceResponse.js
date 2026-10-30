'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SecondChanceResponse = sequelize.define('SecondChanceResponse', {
  response_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  original_event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  organizer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Considering', 'Planning', 'Not Possible'),
    defaultValue: 'Considering',
  },
  response_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  new_session_event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'SecondChanceResponses',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports = SecondChanceResponse;
