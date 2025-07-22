const { AppError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * Middleware to handle errors in Socket.IO event handlers
 */
const socketErrorHandler = (error, socket, event, ...args) => {
  // Default error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode || 500;
    errorCode = error.errorCode || 'APP_ERROR';
    message = error.message;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
    details = error.details;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log the error
  logger.error(`Socket error in event '${event}':`, {
    error: error.message,
    stack: error.stack,
    socketId: socket?.id,
    userId: socket?.user?.id,
    event,
    args: args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg).substring(0, 500) : arg
    )
  });

  // Send error response to client if socket is still connected
  if (socket?.connected) {
    socket.emit('error', {
      code: errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      event
    });
  }

  // For development, log the full error
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Socket Error] ${event}:`, error);
  }
};

/**
 * Wrapper for async event handlers to catch errors
 */
const asyncHandler = (handler) => {
  return async function(socket, ...args) {
    try {
      await handler.apply(this, [socket, ...args]);
    } catch (error) {
      socketErrorHandler(error, socket, handler.name || 'unknown', ...args);
    }
  };
};

/**
 * Applies error handling to all event handlers in a map
 */
const applyErrorHandling = (handlers) => {
  const wrappedHandlers = {};
  
  for (const [event, handler] of Object.entries(handlers)) {
    if (typeof handler === 'function') {
      wrappedHandlers[event] = asyncHandler(handler);
    } else {
      // Handle nested handler objects
      wrappedHandlers[event] = applyErrorHandling(handler);
    }
  }
  
  return wrappedHandlers;
};

module.exports = {
  socketErrorHandler,
  asyncHandler,
  applyErrorHandling
};
