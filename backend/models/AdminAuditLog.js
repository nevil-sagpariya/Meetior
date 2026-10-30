'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminAuditLog = sequelize.define('AdminAuditLog', {
  audit_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  target_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata_json: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: 'AdminAuditLogs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = AdminAuditLog;
