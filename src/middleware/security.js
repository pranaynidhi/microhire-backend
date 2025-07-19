const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('../utils/logger');
const { xssProtection, sanitizeRequestBody, cspConfig } = require('./sanitization');

// Rate limiting configurations
const rateLimits = {
  // Global rate limit (applied to all routes)
  global: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks and static files in production
      if (process.env.NODE_ENV === 'production' && 
          (req.path === '/health' || 
           req.path.startsWith('/uploads/') ||
           req.path.startsWith('/static/'))) {
        return true;
      }
      return false;
    },
    handler: (req, res, next, options) => {
      logger.warn(`Global rate limit exceeded for IP: ${req.ip} at ${req.path}`);
      res.status(options.statusCode).json({
        success: false,
        message: options.message,
        code: 'RATE_LIMIT_EXCEEDED',
      });
    },
  }),
  
  // Stricter limit for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).json({
        success: false,
        message: options.message,
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
      });
    },
  }),
  
  // API endpoints that are more sensitive or resource-intensive
  sensitive: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    message: 'Too many requests to this endpoint, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip} at ${req.path}`);
      res.status(options.statusCode).json({
        success: false,
        message: options.message,
        code: 'SENSITIVE_ENDPOINT_LIMIT_EXCEEDED',
      });
    },
  }),
  
  // Public API endpoints (more lenient)
  public: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per window
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// Apply appropriate rate limiting based on route
const applyRateLimit = (app) => {
  // Apply the strictest limits first
  
  // Authentication routes (most strict)
  app.use(['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'], rateLimits.auth);
  
  // Sensitive API endpoints
  app.use([
    '/api/password', 
    '/api/email', 
    '/api/2fa',
    '/api/users/me',
    '/api/users/change-password',
    '/api/users/delete-account'
  ], rateLimits.sensitive);
  
  // Public API endpoints (more lenient)
  app.use([
    '/api/internships',
    '/api/companies',
    '/api/reviews',
    '/api/categories',
    '/api/skills',
    '/api/locations'
  ], rateLimits.public);
  
  // Apply global rate limit to all other routes
  app.use(rateLimits.global);
};

// Enhanced security headers with Content Security Policy
const securityHeaders = helmet({
  ...helmet.contentSecurityPolicy(cspConfig),
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  // Disable X-Content-Type-Options for static files with custom content types
  contentSecurityPolicy: false, // Disable the default CSP to use our custom one
});

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:80',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Apply security middleware
const applySecurityMiddleware = (app) => {
  // Apply rate limiting based on routes
  applyRateLimit(app);

  // Apply security headers (including CSP)
  app.use(securityHeaders);
  
  // Apply custom XSS protection
  app.use(xssProtection);
  app.use(xss());
  
  // Apply CORS with security headers
  app.use(cors(corsOptions));
  
  // Apply request sanitization
  app.use(sanitizeRequestBody);
  
  // Apply MongoDB sanitization
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logger.warn(`NoSQL injection attempt detected`, {
        path: req.path,
        method: req.method,
        key,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  }));

  // Apply HTTP Parameter Pollution protection
  app.use(hpp({
    whitelist: [
      'page',
      'limit',
      'sort',
      'fields',
      'search',
      'status',
      'type'
    ]
  }));

  // Log security events
  app.use((req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Log request details
    if (process.env.NODE_ENV !== 'test') {
      logger.info({
        type: 'security',
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  });
};

module.exports = {
  applySecurityMiddleware,
  applyRateLimit,
  rateLimits, // Export rateLimits for testing and other modules
};
