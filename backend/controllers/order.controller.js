const { sequelize } = require('../config/db');
const { CustomerOrder, Inventory, Item, Location } = require('../models');

/**
 * @desc    Create a customer order (status: Pending)
 * @route   POST /api/orders
 * @access  Admin, Sales
 */
exports.createOrder = async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, itemId, locationId, batch = 'DEFAULT', quantity, notes } = req.body;

    const order = await CustomerOrder.create({
      customerName,
      customerEmail,
      customerPhone,
      itemId,
      locationId,
      batch,
      quantity,
      notes,
      createdById: req.user.id,
    });

    await order.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all orders
 * @route   GET /api/orders
 * @access  Protected
 */
exports.getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.location) filter.locationId = req.query.location;

    const orders = await CustomerOrder.findAll({
      where: filter,
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Protected
 */
exports.getOrder = async (req, res) => {
  try {
    const order = await CustomerOrder.findByPk(req.params.id, {
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reserve stock for an order (atomic, prevents race conditions)
 * @route   PATCH /api/orders/:id/reserve
 * @access  Admin, Operations, Sales
 */
exports.reserveOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await CustomerOrder.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'Pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Order must be in 'Pending' status to reserve. Current: ${order.status}`,
      });
    }

    // Atomic reservation using Sequelize transaction
    const inv = await Inventory.findOne({
      where: {
        itemId: order.itemId,
        locationId: order.locationId,
        batch: order.batch,
      },
      transaction,
    });

    if (!inv) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Inventory record not found',
      });
    }

    const availableQty = inv.physicalQty - inv.reservedQty;
    if (availableQty < order.quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient available stock to reserve. Available: ${availableQty}, Required: ${order.quantity}`,
      });
    }

    // Update inventory
    await inv.increment('reservedQty', { by: order.quantity, transaction });

    // Update order status
    order.status = 'Reserved';
    order.reservedAt = new Date();
    order.updatedById = req.user.id;
    await order.save({ transaction });

    await transaction.commit();

    await order.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.json({ success: true, message: 'Stock reserved successfully', data: order });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Fulfill a reserved order (reduces physicalQty and reservedQty)
 * @route   PATCH /api/orders/:id/fulfill
 * @access  Admin, Operations
 */
exports.fulfillOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await CustomerOrder.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'Reserved') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Order must be in 'Reserved' status to fulfill. Current: ${order.status}`,
      });
    }

    // Update inventory: reduce both physicalQty and reservedQty
    const inv = await Inventory.findOne({
      where: {
        itemId: order.itemId,
        locationId: order.locationId,
        batch: order.batch,
      },
      transaction,
    });

    if (!inv || inv.reservedQty < order.quantity || inv.physicalQty < order.quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Unable to fulfill: inventory mismatch. Please check inventory records.',
      });
    }

    await inv.decrement('physicalQty', { by: order.quantity, transaction });
    await inv.decrement('reservedQty', { by: order.quantity, transaction });

    // Update order status
    order.status = 'Fulfilled';
    order.fulfilledAt = new Date();
    order.updatedById = req.user.id;
    await order.save({ transaction });

    await transaction.commit();

    await order.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.json({ success: true, message: 'Order fulfilled and stock dispatched', data: order });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cancel an order (releases reserved stock if applicable)
 * @route   PATCH /api/orders/:id/cancel
 * @access  Admin, Sales
 */
exports.cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await CustomerOrder.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (['Fulfilled', 'Cancelled'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status '${order.status}'`,
      });
    }

    // If stock was reserved, release it
    if (order.status === 'Reserved') {
      await Inventory.decrement('reservedQty', {
        by: order.quantity,
        where: {
          itemId: order.itemId,
          locationId: order.locationId,
          batch: order.batch,
        },
        transaction,
      });
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.updatedById = req.user.id;
    await order.save({ transaction });

    await transaction.commit();

    await order.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category', 'unit'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.json({
      success: true,
      message: order.status === 'Reserved'
        ? 'Order cancelled and reserved stock released'
        : 'Order cancelled',
      data: order,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};
