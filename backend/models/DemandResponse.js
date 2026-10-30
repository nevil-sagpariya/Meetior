'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DemandResponse = sequelize.define('DemandResponse', {
  response_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  demand_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  organizer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Considering', 'Planning', 'Fulfilled', 'Not Possible'),
    defaultValue: 'Considering',
  },
  response_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  linked_event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'DemandResponses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = DemandResponse;
