const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Common sanitization rules
const commonSanitizationRules = {
  stringField: (field, min = 1, max = 255) => 
    body(field)
      .trim()
      .isLength({ min, max })
      .withMessage(`must be between ${min} and ${max} characters`)
      .escape(),
      
  emailField: (field) => 
    body(field)
      .isEmail()
      .withMessage('must be a valid email')
      .normalizeEmail(),
      
  passwordField: (field, min = 8) => 
    body(field)
      .isLength({ min })
      .withMessage(`must be at least ${min} characters long`)
      .matches(/[a-z]/)
      .withMessage('must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('must contain at least one uppercase letter')
      .matches(/\d/)
      .withMessage('must contain at least one number'),
      
  numericId: (field) => 
    param(field)
      .isInt({ min: 1 })
      .withMessage('must be a positive integer')
      .toInt(),
      
  sortField: (field, allowedFields) => 
    query(field)
      .optional()
      .isIn(allowedFields)
      .withMessage(`sort field must be one of: ${allowedFields.join(', ')}`),
      
  sortOrder: (field) => 
    query(field)
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage("must be 'asc' or 'desc'"),
      
  page: () => 
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('must be a positive integer')
      .toInt(),
      
  limit: (max = 100) => 
    query('limit')
      .optional()
      .isInt({ min: 1, max })
      .withMessage(`must be between 1 and ${max}`)
      .toInt()
};

// Validation error handler middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    
    logger.warn('Validation failed', { 
      path: req.path, 
      method: req.method,
      errors: errorMessages 
    });
    
    return next(new AppError('Validation failed', 400, {
      errors: errorMessages
    }));
  }
  next();
};

// Sanitize request body to prevent NoSQL injection
const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Remove any keys that start with $ (MongoDB operators)
    const cleanBody = JSON.parse(JSON.stringify(req.body).replace(/\$\w+/g, ''));
    req.body = cleanBody;
  }
  next();
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  // Set X-XSS-Protection header
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

// Content Security Policy configuration
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'https:',
      'http://localhost:3000',
      process.env.CLIENT_URL || 'http://localhost:3000',
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],
    connectSrc: [
      "'self'",
      process.env.API_URL || 'http://localhost:5000',
      process.env.CLIENT_URL || 'http://localhost:3000',
      'ws://localhost:5000',
    ],
    frameAncestors: ["'self'"],
    formAction: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
  reportOnly: process.env.NODE_ENV === 'production',
};

module.exports = {
  commonSanitizationRules,
  validate,
  sanitizeRequestBody,
  xssProtection,
  cspConfig,
};
