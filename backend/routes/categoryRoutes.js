'use strict';
const express = require('express');
const router = express.Router();
const { getCategories } = require('../controllers/categoryController');

// GET /api/categories
router.get('/', getCategories);

module.exports = router;
