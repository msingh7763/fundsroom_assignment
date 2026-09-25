const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createTransfer,
  getTransfers,
  getTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
} = require('../controllers/transfer.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getTransfers);
router.get('/:id', getTransfer);

router.post(
  '/',
  authorize('admin', 'operations'),
  [
    body('sourceLocationId').notEmpty().withMessage('Source location ID is required'),
    body('destLocationId').notEmpty().withMessage('Destination location ID is required'),
    body('itemId').notEmpty().withMessage('Item ID is required'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    validate,
  ],
  createTransfer
);

router.patch('/:id/dispatch', authorize('admin', 'operations'), dispatchTransfer);
router.patch('/:id/receive', authorize('admin', 'operations'), receiveTransfer);
router.patch('/:id/cancel', authorize('admin'), cancelTransfer);

module.exports = router;
