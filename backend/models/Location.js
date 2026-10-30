'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
  location_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  venue_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  formatted_address: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  locality: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postal_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  country_code: {
    type: DataTypes.STRING(5),
    allowNull: true,
    defaultValue: 'IN',
  },
  latitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  google_place_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  discovery_city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'City used for browse/discovery filtering (may differ from admin district)',
  },
}, {
  tableName: 'Locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Location;
