'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const District = sequelize.define('District', {
  district_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  district_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: 'Districts',
  timestamps: false,
  indexes: [
    { fields: ['state_id'] },
    { fields: ['district_name'] },
  ],
});

module.exports = District;
