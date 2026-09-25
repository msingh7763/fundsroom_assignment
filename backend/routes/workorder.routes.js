const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createWorkOrder,
  getWorkOrders,
  getWorkOrder,
  updateWorkOrderStatus,
  deleteWorkOrder,
} = require('../controllers/workorder.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getWorkOrders);
router.get('/:id', getWorkOrder);

router.post(
  '/',
  authorize('admin'),
  [
    body('locationId').notEmpty().withMessage('Location ID is required'),
    body('itemId').notEmpty().withMessage('Item ID is required'),
    body('requiredQty')
      .isInt({ min: 1 })
      .withMessage('Required quantity must be at least 1'),
    body('assignedUserId').notEmpty().withMessage('Assigned user ID is required'),
    validate,
  ],
  createWorkOrder
);

router.patch(
  '/:id/status',
  authorize('admin', 'operations'),
  [
    body('status')
      .isIn(['Assigned', 'InProgress', 'Completed'])
      .withMessage('Status must be Assigned, InProgress, or Completed'),
    validate,
  ],
  updateWorkOrderStatus
);

router.delete('/:id', authorize('admin'), deleteWorkOrder);

module.exports = router;
