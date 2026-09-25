const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  getMe,
  getUsers,
  updateUser,
} = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Public routes
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

// Protected routes
router.get('/me', protect, getMe);

// Admin only
router.post(
  '/register',
  protect,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['admin', 'operations', 'sales'])
      .withMessage('Role must be admin, operations, or sales'),
    validate,
  ],
  register
);

router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);

module.exports = router;
