const { validationResult } = require('express-validator');

class CustomError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ValidationError extends CustomError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class AuthError extends CustomError {
  constructor(message, details) {
    super('AUTH_ERROR', message, 401, details);
  }
}

class ForbiddenError extends CustomError {
  constructor(message, details) {
    super('FORBIDDEN', message, 403, details);
  }
}

class NotFoundError extends CustomError {
  constructor(message, details) {
    super('NOT_FOUND', message, 404, details);
  }
}

class ConflictError extends CustomError {
  constructor(message, details) {
    super('CONFLICT', message, 409, details);
  }
}

class BadRequestError extends CustomError {
  constructor(message, details) {
    super('BAD_REQUEST', message, 400, details);
  }
}

function validationErrorMiddleware(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.param,
        message: e.msg
      })),
      meta: { timestamp: new Date().toISOString() }
    });
  }
  next();
}

function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
      details: err.details,
      meta: { timestamp }
    });
  }
  
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred',
    details: null,
    meta: { timestamp }
  });
}

module.exports = {
  errorHandler,
  validationErrorMiddleware,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BadRequestError
};
