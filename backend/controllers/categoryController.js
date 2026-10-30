'use strict';

const { Category } = require('../models');

// GET /api/categories
const getCategories = async (_req, res) => {
  try {
    const cats = await Category.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });
    return res.json({ success: true, categories: cats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load categories.' });
  }
};

module.exports = { getCategories };
