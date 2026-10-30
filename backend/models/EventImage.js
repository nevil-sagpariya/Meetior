'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventImage = sequelize.define('EventImage', {
  image_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  original_image_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  sketch_image_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  generation_status: {
    type: DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Failed'),
    defaultValue: 'Pending',
  },
  generation_error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'EventImages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EventImage;
