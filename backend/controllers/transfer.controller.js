const { sequelize } = require('../config/db');
const { Transfer, Inventory, Item, Location } = require('../models');

/**
 * @desc    Create a stock transfer request
 * @route   POST /api/transfers
 * @access  Admin, Operations
 */
exports.createTransfer = async (req, res) => {
  try {
    const { sourceLocationId, destLocationId, itemId, batch = 'DEFAULT', quantity, notes } = req.body;

    if (sourceLocationId === destLocationId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination locations must be different',
      });
    }

    // Verify sufficient available stock at source
    const sourceInv = await Inventory.findOne({
      where: { itemId, locationId: sourceLocationId, batch },
    });
    if (!sourceInv) {
      return res.status(400).json({
        success: false,
        message: 'No inventory record found at source location for this item/batch',
      });
    }
    if (sourceInv.physicalQty - sourceInv.reservedQty < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available stock. Available: ${sourceInv.physicalQty - sourceInv.reservedQty}, Requested: ${quantity}`,
      });
    }

    const transfer = await Transfer.create({
      sourceLocationId,
      destLocationId,
      itemId,
      batch,
      quantity,
      notes,
      createdById: req.user.id,
    });

    await transfer.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category'] },
        { model: Location, as: 'sourceLocation', attributes: ['id', 'name', 'code'] },
        { model: Location, as: 'destLocation', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all transfers
 * @route   GET /api/transfers
 * @access  Protected
 */
exports.getTransfers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sourceLocation) filter.sourceLocationId = req.query.sourceLocation;
    if (req.query.destLocation) filter.destLocationId = req.query.destLocation;

    const transfers = await Transfer.findAll({
      where: filter,
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category'] },
        { model: Location, as: 'sourceLocation', attributes: ['id', 'name', 'code'] },
        { model: Location, as: 'destLocation', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, count: transfers.length, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single transfer
 * @route   GET /api/transfers/:id
 * @access  Protected
 */
exports.getTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findByPk(req.params.id, {
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category'] },
        { model: Location, as: 'sourceLocation', attributes: ['id', 'name', 'code'] },
        { model: Location, as: 'destLocation', attributes: ['id', 'name', 'code'] },
      ],
    });

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Dispatch a transfer (reduces source inventory atomically)
 * @route   PATCH /api/transfers/:id/dispatch
 * @access  Admin, Operations
 */
exports.dispatchTransfer = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const transfer = await Transfer.findByPk(req.params.id, { transaction });
    if (!transfer) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    if (transfer.status !== 'Requested') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Transfer must be in 'Requested' status to dispatch. Current: ${transfer.status}`,
      });
    }

    // Get source inventory inside the transaction
    const sourceInv = await Inventory.findOne({
      where: {
        itemId: transfer.itemId,
        locationId: transfer.sourceLocationId,
        batch: transfer.batch,
      },
      transaction,
    });

    if (!sourceInv) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Source inventory not found',
      });
    }

    const availableQty = sourceInv.physicalQty - sourceInv.reservedQty;
    if (availableQty < transfer.quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Insufficient available stock at source location to dispatch',
      });
    }

    // Reduce source physical quantity
    await sourceInv.decrement('physicalQty', { by: transfer.quantity, transaction });

    // Update transfer status
    transfer.status = 'Dispatched';
    transfer.dispatchedAt = new Date();
    transfer.updatedById = req.user.id;
    await transfer.save({ transaction });

    await transaction.commit();

    await transfer.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category'] },
        { model: Location, as: 'sourceLocation', attributes: ['id', 'name', 'code'] },
        { model: Location, as: 'destLocation', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.json({
      success: true,
      message: 'Transfer dispatched. Source inventory reduced.',
      data: transfer,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Receive a transfer (increases dest inventory atomically, prevents double receipt)
 * @route   PATCH /api/transfers/:id/receive
 * @access  Admin, Operations
 */
exports.receiveTransfer = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const transfer = await Transfer.findByPk(req.params.id, { transaction });
    if (!transfer) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    // Prevent double receipt
    if (transfer.status === 'Received') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Transfer has already been received (duplicate receipt prevented)',
      });
    }
    if (transfer.status !== 'Dispatched') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Transfer must be in 'Dispatched' status to receive. Current: ${transfer.status}`,
      });
    }

    // Upsert: add to dest inventory (create if not exists), inside the transaction
    const [destInv] = await Inventory.findOrCreate({
      where: {
        itemId: transfer.itemId,
        locationId: transfer.destLocationId,
        batch: transfer.batch,
      },
      defaults: { physicalQty: 0, reservedQty: 0 },
      transaction,
    });

    await destInv.increment('physicalQty', { by: transfer.quantity, transaction });

    // Update transfer status
    transfer.status = 'Received';
    transfer.receivedAt = new Date();
    transfer.updatedById = req.user.id;
    await transfer.save({ transaction });

    await transaction.commit();

    await transfer.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category'] },
        { model: Location, as: 'sourceLocation', attributes: ['id', 'name', 'code'] },
        { model: Location, as: 'destLocation', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.json({
      success: true,
      message: 'Transfer received. Destination inventory updated.',
      data: transfer,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cancel a transfer (only if Requested)
 * @route   PATCH /api/transfers/:id/cancel
 * @access  Admin
 */
exports.cancelTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findByPk(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    if (transfer.status !== 'Requested') {
      return res.status(400).json({
        success: false,
        message: 'Only transfers in Requested status can be cancelled',
      });
    }
    transfer.status = 'Cancelled';
    transfer.updatedById = req.user.id;
    await transfer.save();
    res.json({ success: true, message: 'Transfer cancelled', data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
