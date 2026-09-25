const { WorkOrder, Inventory, User, Item, Location } = require('../models');

/**
 * @desc    Create a work order
 * @route   POST /api/workorders
 * @access  Admin, Operations
 */
exports.createWorkOrder = async (req, res) => {
  try {
    const { locationId, itemId, requiredQty, assignedUserId, notes } = req.body;

    // Validate assigned user exists
    const userDoc = await User.findByPk(assignedUserId);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'Assigned user not found' });
    }

    // Get current available qty at location for shortage calc
    const invRecord = await Inventory.findOne({
      where: { itemId, locationId },
    });
    const availableQtyAtCreation = invRecord ? invRecord.physicalQty - invRecord.reservedQty : 0;
    const shortageQty = Math.max(0, requiredQty - availableQtyAtCreation);

    const workOrder = await WorkOrder.create({
      locationId,
      itemId,
      requiredQty,
      assignedUserId,
      availableQtyAtCreation,
      shortageQty,
      notes,
      createdById: req.user.id,
    });

    await workOrder.reload({
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    res.status(201).json({ success: true, data: workOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all work orders
 * @route   GET /api/workorders
 * @access  Protected
 */
exports.getWorkOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedUser) filter.assignedUserId = req.query.assignedUser;
    if (req.query.location) filter.locationId = req.query.location;

    // Operations can only see work orders assigned to them
    if (req.user.role === 'operations') {
      filter.assignedUserId = req.user.id;
    }

    const workOrders = await WorkOrder.findAll({
      where: filter,
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, count: workOrders.length, data: workOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single work order
 * @route   GET /api/workorders/:id
 * @access  Protected
 */
exports.getWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id, {
      include: [
        { model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'category'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }
    res.json({ success: true, data: workOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update work order status
 * @route   PATCH /api/workorders/:id/status
 * @access  Admin, Operations
 */
exports.updateWorkOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      Assigned: ['InProgress'],
      InProgress: ['Completed'],
      Completed: [],
    };

    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }

    if (!validTransitions[workOrder.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${workOrder.status}' to '${status}'`,
      });
    }

    workOrder.status = status;
    await workOrder.save();

    res.json({ success: true, message: `Status updated to ${status}`, data: workOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete work order (admin only, only if Assigned)
 * @route   DELETE /api/workorders/:id
 * @access  Admin
 */
exports.deleteWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }
    if (workOrder.status !== 'Assigned') {
      return res.status(400).json({
        success: false,
        message: 'Only work orders in Assigned status can be deleted',
      });
    }
    await workOrder.destroy();
    res.json({ success: true, message: 'Work order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
