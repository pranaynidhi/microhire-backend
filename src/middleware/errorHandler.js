const { AppError, ErrorTypes } = require('../utils/errors');
const logger = require('../utils/logger');

// Global error handler
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error with request context
  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
      path: req.path
    });
  } else {
    // Production error response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        errors: err.errors
      });
    } else {
      // Programming or unknown errors
      logger.error('Unexpected error:', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  // Give time for pending requests to complete
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Give time for pending requests to complete
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  // Give time for pending requests to complete
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

module.exports = errorHandler;
