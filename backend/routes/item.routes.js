const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
} = require('../controllers/item.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getItems);
router.get('/:id', getItem);

router.post(
  '/',
  authorize('admin', 'operations'),
  [
    body('name').notEmpty().withMessage('Item name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('category').notEmpty().withMessage('Category is required'),
    validate,
  ],
  createItem
);

router.put('/:id', authorize('admin', 'operations'), updateItem);
router.delete('/:id', authorize('admin'), deleteItem);

module.exports = router;
