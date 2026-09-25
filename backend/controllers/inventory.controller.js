const { sequelize } = require('../config/db');
const { Inventory, Item, Location } = require('../models');

/**
 * @desc    Get all inventory records (with populate)
 * @route   GET /api/inventory
 * @access  Protected
 */
exports.getInventory = async (req, res) => {
  try {
    const filter = {};
    if (req.query.location) filter.locationId = req.query.location;
    if (req.query.item) filter.itemId = req.query.item;

    const inventory = await Inventory.findAll({
      where: filter,
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Add virtual availableQty to response
    const inventoryWithAvailable = inventory.map((inv) => ({
      ...inv.toJSON(),
      availableQty: inv.physicalQty - inv.reservedQty,
    }));

    res.json({ success: true, count: inventory.length, data: inventoryWithAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get a single inventory record
 * @route   GET /api/inventory/:id
 * @access  Protected
 */
exports.getInventoryById = async (req, res) => {
  try {
    const inv = await Inventory.findByPk(req.params.id, {
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
    });

    if (!inv) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    res.json({
      success: true,
      data: {
        ...inv.toJSON(),
        availableQty: inv.physicalQty - inv.reservedQty,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create or upsert an inventory record
 * @route   POST /api/inventory
 * @access  Admin, Operations
 */
exports.createInventory = async (req, res) => {
  try {
    const { itemId, locationId, batch = 'DEFAULT', physicalQty, reservedQty = 0 } = req.body;

    // Validate item and location exist
    const [itemDoc, locationDoc] = await Promise.all([
      Item.findByPk(itemId),
      Location.findByPk(locationId),
    ]);
    if (!itemDoc) return res.status(404).json({ success: false, message: 'Item not found' });
    if (!locationDoc)
      return res.status(404).json({ success: false, message: 'Location not found' });

    if (physicalQty < 0) {
      return res.status(400).json({ success: false, message: 'Physical quantity cannot be negative' });
    }
    if (reservedQty > physicalQty) {
      return res.status(400).json({
        success: false,
        message: 'Reserved quantity cannot exceed physical quantity',
      });
    }

    // Upsert: update if exists, otherwise create
    const [inv, created] = await Inventory.findOrCreate({
      where: { itemId, locationId, batch },
      defaults: { physicalQty, reservedQty },
    });

    if (!created) {
      await inv.update({ physicalQty, reservedQty });
    }

    await inv.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.status(201).json({
      success: true,
      data: {
        ...inv.toJSON(),
        availableQty: inv.physicalQty - inv.reservedQty,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Adjust physical quantity (add/remove stock)
 * @route   PATCH /api/inventory/:id/adjust
 * @access  Admin, Operations
 */
exports.adjustInventory = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { adjustment, reason } = req.body;

    const inv = await Inventory.findByPk(req.params.id, { transaction });
    if (!inv) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    const newPhysical = inv.physicalQty + adjustment;
    if (newPhysical < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Adjustment would result in negative physical quantity (${newPhysical})`,
      });
    }
    if (newPhysical < inv.reservedQty) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Adjustment would make physical qty (${newPhysical}) less than reserved qty (${inv.reservedQty})`,
      });
    }

    await inv.increment('physicalQty', { by: adjustment, transaction });
    await transaction.commit();

    await inv.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.json({
      success: true,
      message: `Stock adjusted by ${adjustment}`,
      data: {
        ...inv.toJSON(),
        availableQty: inv.physicalQty - inv.reservedQty,
      },
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete inventory record
 * @route   DELETE /api/inventory/:id
 * @access  Admin
 */
exports.deleteInventory = async (req, res) => {
  try {
    const inv = await Inventory.findByPk(req.params.id);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }
    if (inv.reservedQty > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete inventory with active reservations',
      });
    }
    await inv.destroy();
    res.json({ success: true, message: 'Inventory record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
