const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

router.get('/analytics', adminController.getAnalytics);

module.exports = router;
