const { Item } = require('../models');
const { UniqueConstraintError } = require('sequelize');

/**
 * @desc    Create item
 * @route   POST /api/items
 * @access  Admin, Operations
 */
exports.createItem = async (req, res) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({
        success: false,
        message: 'An item with this SKU already exists',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all items
 * @route   GET /api/items
 * @access  Protected
 */
exports.getItems = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;

    const items = await Item.findAll({
      where: filter,
      order: [['name', 'ASC']],
    });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single item
 * @route   GET /api/items/:id
 * @access  Protected
 */
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update item
 * @route   PUT /api/items/:id
 * @access  Admin, Operations
 */
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    await item.update(req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete (deactivate) item
 * @route   DELETE /api/items/:id
 * @access  Admin
 */
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    await item.update({ isActive: false });
    res.json({ success: true, message: 'Item deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
