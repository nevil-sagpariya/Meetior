'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  registration_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  gateway: {
    type: DataTypes.STRING(50),
    defaultValue: 'razorpay',
  },
  gateway_order_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  gateway_payment_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(5),
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Failed', 'Refunded'),
    defaultValue: 'Pending',
  },
  payment_mode: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Payment;
