'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlatformSetting = sequelize.define('PlatformSetting', {
  setting_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  setting_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'system',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'PlatformSettings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PlatformSetting;
