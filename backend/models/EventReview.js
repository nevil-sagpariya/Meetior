'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventReview = sequelize.define('EventReview', {
  review_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rating: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('approved', 'flagged', 'hidden'),
    allowNull: false,
    defaultValue: 'approved',
  },
}, {
  tableName: 'EventReviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['event_id', 'user_id'],
    },
  ],
});

module.exports = EventReview;
