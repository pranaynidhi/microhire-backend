const { AppError, ErrorTypes } = require('../utils/errors');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error({
    error: err,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      user: req.user?.id
    }
  });

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors,
      stack: err.stack
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
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};

module.exports = errorHandler;
