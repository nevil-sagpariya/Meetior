'use strict';

const { EventInteraction, Event } = require('../models');

const interact = async (req, res, type) => {
  try {
    const event_id = parseInt(req.params.id);
    const user_id  = req.user.user_id;

    const ev = await Event.findByPk(event_id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });

    const [record, created] = await EventInteraction.findOrCreate({
      where: { user_id, event_id, interaction_type: type },
      defaults: { user_id, event_id, interaction_type: type },
    });

    const verb = type === 'Going' ? 'going' : type === 'Interested' ? 'interested' : 'saved';
    return res.json({
      success: true,
      created,
      message: created ? `Marked as ${verb}!` : `Already marked as ${verb}.`,
    });
  } catch (err) {
    console.error('interact error:', err);
    return res.status(500).json({ success: false, message: 'Could not update interaction.' });
  }
};

const removeInteraction = async (req, res, type) => {
  try {
    const deleted = await EventInteraction.destroy({
      where: { user_id: req.user.user_id, event_id: parseInt(req.params.id), interaction_type: type },
    });
    return res.json({ success: true, removed: deleted > 0, message: deleted ? 'Removed.' : 'Not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not remove interaction.' });
  }
};

const putGoing      = (req, res) => interact(req, res, 'Going');
const deleteGoing   = (req, res) => removeInteraction(req, res, 'Going');
const putInterested    = (req, res) => interact(req, res, 'Interested');
const deleteInterested = (req, res) => removeInteraction(req, res, 'Interested');
const putSave       = (req, res) => interact(req, res, 'Saved');
const deleteSave    = (req, res) => removeInteraction(req, res, 'Saved');

// GET /api/users/me/saved-events
const getSavedEvents = async (req, res) => {
  try {
    const { EventImage, Category, Location, User, Event: EventModel } = require('../models');
    const saved = await EventInteraction.findAll({
      where: { user_id: req.user.user_id, interaction_type: 'Saved' },
      include: [{
        model: EventModel,
        as: 'Event',
        include: [
          { model: Category, as: 'category', attributes: ['name', 'icon'] },
          { model: Location, as: 'location' },
          { model: EventImage, as: 'images', limit: 1 },
          { model: User, as: 'organizer', attributes: ['name'] },
        ],
      }],
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, saved_events: saved.map(s => s.Event) });
  } catch (err) {
    console.error('getSavedEvents error:', err);
    return res.status(500).json({ success: false, message: 'Could not load saved events.' });
  }
};

module.exports = { putGoing, deleteGoing, putInterested, deleteInterested, putSave, deleteSave, getSavedEvents };
