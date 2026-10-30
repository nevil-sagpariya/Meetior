'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventDemand = sequelize.define('EventDemand', {
  demand_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  preferred_location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  preferred_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Open', 'Considering', 'Planning', 'Fulfilled', 'Not Possible'),
    defaultValue: 'Open',
  },
  linked_event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'EventDemands',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EventDemand;
