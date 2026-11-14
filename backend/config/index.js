'use strict';

const sequelize = require('./database');

module.exports = {
  sequelize,
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'meetior_super_secure_jwt_secret_2026',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
