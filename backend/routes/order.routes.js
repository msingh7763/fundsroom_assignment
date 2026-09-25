const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrder,
  reserveOrder,
  fulfillOrder,
  cancelOrder,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getOrders);
router.get('/:id', getOrder);

router.post(
  '/',
  authorize('admin', 'sales', 'operations'),
  [
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('itemId').notEmpty().withMessage('Item ID is required'),
    body('locationId').notEmpty().withMessage('Location ID is required'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    validate,
  ],
  createOrder
);

router.patch('/:id/reserve', authorize('admin', 'operations', 'sales'), reserveOrder);
router.patch('/:id/fulfill', authorize('admin', 'operations'), fulfillOrder);
router.patch('/:id/cancel', authorize('admin', 'sales'), cancelOrder);

module.exports = router;
