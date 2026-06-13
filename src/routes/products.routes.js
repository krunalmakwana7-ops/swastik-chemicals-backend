const express = require('express');
const { body, query } = require('express-validator');
const productsController = require('../controllers/products.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validationErrorMiddleware } = require('../middleware/errorHandler');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  [
    body('productName').notEmpty(),
    body('grade').optional().isIn(['TEXTILE', 'CHEMICAL', 'FOOD']),
    body('moqKg').isFloat({ min: 0 }),
    body('pricePerKg').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean()
  ],
  validationErrorMiddleware,
  productsController.createProduct
);

router.get(
  '/',
  [query('activeOnly').optional().isBoolean()],
  validationErrorMiddleware,
  productsController.listProducts
);

module.exports = router;
