const { Location } = require('../models');
const { UniqueConstraintError } = require('sequelize');

/**
 * @desc    Create location
 * @route   POST /api/locations
 * @access  Admin
 */
exports.createLocation = async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({
        success: false,
        message: 'Location with this name or code already exists',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all locations
 * @route   GET /api/locations
 * @access  Protected
 */
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
    res.json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single location
 * @route   GET /api/locations/:id
 * @access  Protected
 */
exports.getLocation = async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update location
 * @route   PUT /api/locations/:id
 * @access  Admin
 */
exports.updateLocation = async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    await location.update(req.body);
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete (deactivate) location
 * @route   DELETE /api/locations/:id
 * @access  Admin
 */
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    await location.update({ isActive: false });
    res.json({ success: true, message: 'Location deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
