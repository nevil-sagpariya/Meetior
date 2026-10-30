'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: [2, 100] },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('Attendee', 'Organizer', 'Admin'),
    allowNull: false,
    defaultValue: 'Attendee',
  },
  admin_role: {
    type: DataTypes.ENUM('Super Admin', 'Event Moderator', 'Support Admin', 'Finance Admin'),
    allowNull: false,
    defaultValue: 'Super Admin',
  },
  mfa_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  mfa_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  account_status: {
    type: DataTypes.ENUM('active', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
  },
  profile_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  phone_number: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
}, {
  tableName: 'Users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
