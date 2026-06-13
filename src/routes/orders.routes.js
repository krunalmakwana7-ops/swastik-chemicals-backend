const express = require('express');
const { body, param } = require('express-validator');
const ordersController = require('../controllers/orders.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validationErrorMiddleware } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('productId').isUUID(),
    body('quantityKg').isFloat({ min: 0 }),
    body('requestedDeliveryAt').isISO8601()
  ],
  validationErrorMiddleware,
  ordersController.createOrder
);

router.get('/', ordersController.listOrders);

router.get(
  '/:id',
  [param('id').isUUID()],
  validationErrorMiddleware,
  ordersController.getOrderDetail
);

router.patch(
  '/:id/status',
  requireRole('ADMIN'),
  [
    param('id').isUUID(),
    body('status').isIn(['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED'])
  ],
  validationErrorMiddleware,
  ordersController.updateOrderStatus
);

module.exports = router;
