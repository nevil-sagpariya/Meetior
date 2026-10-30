'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const City = sequelize.define('City', {
  city_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  city_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  is_popular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'Cities',
  timestamps: false,
  indexes: [
    { fields: ['district_id'] },
    { fields: ['city_name'] },
  ],
});

module.exports = City;
