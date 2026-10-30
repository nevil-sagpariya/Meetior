'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DemandSupporter = sequelize.define('DemandSupporter', {
  supporter_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  demand_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'DemandSupporters',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['demand_id', 'user_id'],
    },
  ],
});

module.exports = DemandSupporter;
