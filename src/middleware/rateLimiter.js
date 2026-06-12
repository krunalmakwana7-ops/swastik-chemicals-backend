const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests to authentication endpoints. Please try again later.',
    details: null,
    meta: { timestamp: new Date().toISOString() }
  },
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'test';
  }
});

module.exports = {
  authRateLimiter
};
