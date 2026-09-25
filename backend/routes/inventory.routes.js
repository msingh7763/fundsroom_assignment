const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getInventory,
  getInventoryById,
  createInventory,
  adjustInventory,
  deleteInventory,
} = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getInventory);
router.get('/:id', getInventoryById);

router.post(
  '/',
  authorize('admin', 'operations'),
  [
    body('itemId').notEmpty().withMessage('Item ID is required'),
    body('locationId').notEmpty().withMessage('Location ID is required'),
    body('physicalQty')
      .isInt({ min: 0 })
      .withMessage('Physical quantity must be a non-negative integer'),
    body('reservedQty')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reserved quantity must be a non-negative integer'),
    validate,
  ],
  createInventory
);

router.patch(
  '/:id/adjust',
  authorize('admin', 'operations'),
  [
    body('adjustment')
      .isInt()
      .not()
      .equals('0')
      .withMessage('Adjustment must be a non-zero integer'),
    validate,
  ],
  adjustInventory
);

router.delete('/:id', authorize('admin'), deleteInventory);

module.exports = router;
