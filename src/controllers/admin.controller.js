const pool = require('../config/db');
const analyticsService = require('../services/analytics.service');
const { NotFoundError } = require('../middleware/errorHandler');

async function getAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getClientUsageAnalytics();
    
    res.status(200).json({
      success: true,
      data: analytics,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAnalytics
};
