'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminRolePermission = sequelize.define('AdminRolePermission', {
  permission_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_name: {
    type: DataTypes.ENUM('Super Admin', 'Event Moderator', 'Support Admin', 'Finance Admin'),
    allowNull: false,
  },
  permission_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'AdminRolePermissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['role_name', 'permission_key'],
    },
  ],
});

module.exports = AdminRolePermission;
