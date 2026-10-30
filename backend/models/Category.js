'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true,
  },
  slug: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true,
  },
  icon: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: '🎉',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'Categories',
  timestamps: false,
});

module.exports = Category;
