'use strict';

const {
  EventDemand, DemandSupporter, DemandResponse, Category, User, Event, Location, sequelize,
} = require('../models');
const notificationService = require('../services/notificationService');
const { Op } = require('sequelize');
const { resolveCanonicalCity } = require('../utils/cityResolver');

// GET /api/demands
const getDemands = async (req, res) => {
  try {
    const { city, category, status, page = 1, limit = 12 } = req.query;
    const where = {};
    if (city && city.toLowerCase() !== 'all') {
      const canonical = resolveCanonicalCity(city);
      where[Op.or] = [
        { city: { [Op.like]: `%${city.trim()}%` } },
        { city: { [Op.like]: `%${canonical}%` } },
      ];
    }
    if (status) where.status = status;
    const categoryWhere = {};
    if (category) categoryWhere.slug = category;

    const { count, rows } = await EventDemand.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: Category, as: 'category', where: Object.keys(categoryWhere).length ? categoryWhere : undefined, attributes: ['name', 'icon'] },
        { model: DemandSupporter, as: 'supporters', attributes: ['user_id'] },
        { model: Event, as: 'linked_event', attributes: ['event_id', 'title', 'status'] },
      ],
      order: [[sequelize.literal('(SELECT COUNT(*) FROM DemandSupporters WHERE DemandSupporters.demand_id = EventDemand.demand_id)'), 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
    });

    return res.json({
      success: true,
      demands: rows.map(d => ({
        ...d.toJSON(),
        supporter_count: d.supporters ? d.supporters.length : 0,
        user_is_supporting: req.user ? d.supporters?.some(s => s.user_id === req.user.user_id) : false,
      })),
      total: count,
    });
  } catch (err) {
    console.error('getDemands error:', err);
    return res.status(500).json({ success: false, message: 'Could not load demands.' });
  }
};

// POST /api/demands
const createDemand = async (req, res) => {
  try {
    const demand = await EventDemand.create({
      created_by: req.user.user_id,
      title: req.body.title,
      description: req.body.description,
      category_id: req.body.category_id || null,
      city: req.body.city,
      preferred_location: req.body.preferred_location,
      preferred_date: req.body.preferred_date || null,
      status: 'Open',
    });
    return res.status(201).json({ success: true, message: 'Event demand submitted!', demand });
  } catch (err) {
    console.error('createDemand error:', err);
    return res.status(500).json({ success: false, message: 'Could not create demand.' });
  }
};

// GET /api/demands/:id
const getDemandById = async (req, res) => {
  try {
    const d = await EventDemand.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: Category, as: 'category', attributes: ['name', 'icon'] },
        { model: DemandSupporter, as: 'supporters', include: [{ model: User, as: 'user', attributes: ['name'] }] },
        { model: DemandResponse, as: 'responses', include: [{ model: User, as: 'organizer', attributes: ['name'] }] },
        { model: Event, as: 'linked_event' },
      ],
    });
    if (!d) return res.status(404).json({ success: false, message: 'Demand not found.' });
    return res.json({ success: true, demand: d });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load demand.' });
  }
};

// POST /api/demands/:id/support
const supportDemand = async (req, res) => {
  try {
    const [s, created] = await DemandSupporter.findOrCreate({
      where: { demand_id: parseInt(req.params.id), user_id: req.user.user_id },
      defaults: { demand_id: parseInt(req.params.id), user_id: req.user.user_id },
    });
    return res.json({ success: true, supported: created, message: created ? 'Support added!' : 'Already supporting.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not add support.' });
  }
};

// DELETE /api/demands/:id/support
const unsupportDemand = async (req, res) => {
  try {
    const deleted = await DemandSupporter.destroy({
      where: { demand_id: parseInt(req.params.id), user_id: req.user.user_id },
    });
    return res.json({ success: true, removed: deleted > 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not remove support.' });
  }
};

// POST /api/demands/:id/responses
const respondToDemand = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const demand_id = parseInt(req.params.id);
    const demand = await EventDemand.findByPk(demand_id, { transaction: t });
    if (!demand) { await t.rollback(); return res.status(404).json({ success: false, message: 'Demand not found.' }); }

    const response = await DemandResponse.create({
      demand_id,
      organizer_id: req.user.user_id,
      status: req.body.status,
      response_message: req.body.response_message,
      linked_event_id: req.body.linked_event_id || null,
    }, { transaction: t });

    // Update demand status
    demand.status = req.body.demand_status || req.body.status;
    if (req.body.linked_event_id) demand.linked_event_id = req.body.linked_event_id;
    await demand.save({ transaction: t });

    await t.commit();

    // Notify supporters
    const supporters = await DemandSupporter.findAll({ where: { demand_id }, attributes: ['user_id'] });
    for (const s of supporters) {
      await notificationService.notify(
        s.user_id, 'demand_response', `Organizer responded to your event request!`,
        `"${demand.title}" – Status: ${req.body.status}. ${req.body.response_message || ''}`,
        null, demand_id
      );
    }

    return res.status(201).json({ success: true, message: 'Response submitted and supporters notified.', response });
  } catch (err) {
    await t.rollback();
    console.error('respondToDemand error:', err);
    return res.status(500).json({ success: false, message: 'Could not submit response.' });
  }
};

module.exports = { getDemands, createDemand, getDemandById, supportDemand, unsupportDemand, respondToDemand };
