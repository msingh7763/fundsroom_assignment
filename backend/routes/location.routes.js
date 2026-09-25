const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/location.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getLocations);
router.get('/:id', getLocation);

router.post(
  '/',
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Location name is required'),
    body('code').notEmpty().withMessage('Location code is required'),
    validate,
  ],
  createLocation
);

router.put('/:id', authorize('admin'), updateLocation);
router.delete('/:id', authorize('admin'), deleteLocation);

module.exports = router;
