const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');
const { validationErrorMiddleware } = require('../middleware/errorHandler');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/register',
  authRateLimiter,
  [
    body('email').optional().isEmail(),
    body('mobile').optional().matches(/^[0-9]{10}$/),
    body('password').isLength({ min: 8 }),
    body('companyName').notEmpty(),
    body('ownerName').notEmpty(),
    body('deliveryAddress').notEmpty(),
    body('gstNumber').matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
  ],
  validationErrorMiddleware,
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  [
    body('identifier').notEmpty(),
    body('password').notEmpty(),
    body('rememberMe').optional().isBoolean()
  ],
  validationErrorMiddleware,
  authController.login
);

router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

module.exports = router;
