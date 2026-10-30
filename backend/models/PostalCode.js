'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostalCode = sequelize.define('PostalCode', {
  postal_code_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  pincode: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  city_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  post_office_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  locality_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
}, {
  tableName: 'PostalCodes',
  timestamps: false,
  indexes: [
    { fields: ['pincode'] },
    { fields: ['state_id'] },
    { fields: ['district_id'] },
  ],
});

module.exports = PostalCode;
