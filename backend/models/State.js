'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const State = sequelize.define('State', {
  state_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  state_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  state_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('State', 'Union Territory'),
    defaultValue: 'State',
    allowNull: false,
  },
}, {
  tableName: 'States',
  timestamps: false,
});

module.exports = State;
