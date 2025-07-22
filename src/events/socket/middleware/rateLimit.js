const rateLimit = require('express-rate-limit');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { AppError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

// Rate limiting configuration
const rateLimiters = {
  // Global rate limiter (per IP)
  global: new RateLimiterMemory({
    points: 100, // 100 points
    duration: 60, // per 60 seconds
    blockDuration: 60 * 5, // Block for 5 minutes if limit is exceeded
    keyPrefix: 'socket_global'
  }),
  
  // Authentication rate limiter (per IP)
  auth: new RateLimiterMemory({
    points: 10, // 10 login attempts
    duration: 60 * 60, // per hour
    blockDuration: 60 * 60, // Block for 1 hour if limit is exceeded
    keyPrefix: 'socket_auth'
  }),
  
  // Message rate limiter (per user)
  message: new RateLimiterMemory({
    points: 60, // 60 messages
    duration: 60, // per minute
    blockDuration: 60 * 5, // Block for 5 minutes if limit is exceeded
    keyPrefix: 'socket_message'
  }),
  
  // Notification rate limiter (per user)
  notification: new RateLimiterMemory({
    points: 100, // 100 notifications
    duration: 60 * 10, // per 10 minutes
    blockDuration: 60 * 10, // Block for 10 minutes if limit is exceeded
    keyPrefix: 'socket_notification'
  })
};

/**
 * Middleware to apply rate limiting to socket events
 * @param {string} type - Type of rate limiter to use ('global', 'auth', 'message', 'notification')
 * @param {object} options - Additional options
 * @param {number} [options.points] - Override default points
 * @param {number} [options.duration] - Override default duration in seconds
 * @param {function} [options.keyGenerator] - Function to generate rate limit key (defaults to IP)
 */
const socketRateLimiter = (type = 'global', options = {}) => {
  const limiter = rateLimiters[type];
  
  if (!limiter) {
    throw new Error(`Invalid rate limiter type: ${type}`);
  }
  
  // Create a new limiter instance with custom options if provided
  const effectiveLimiter = options.points || options.duration
    ? new RateLimiterMemory({
        points: options.points || limiter.points,
        duration: options.duration || limiter.duration,
        blockDuration: limiter.blockDuration,
        keyPrefix: limiter.keyPrefix
      })
    : limiter;
  
  return async (socket, next) => {
    try {
      // Generate rate limit key (default to IP address)
      const ip = socket.handshake.address;
      const key = options.keyGenerator 
        ? await options.keyGenerator(socket)
        : `${type}_${ip}`;
      
      // Consume a point
      await effectiveLimiter.consume(key);
      
      // Add rate limit headers to socket for client information
      const rateLimitInfo = await effectiveLimiter.get(key);
      if (rateLimitInfo) {
        socket.rateLimit = {
          limit: effectiveLimiter.points,
          remaining: rateLimitInfo.remainingPoints,
          reset: Math.ceil(rateLimitInfo.msBeforeNext / 1000)
        };
      }
      
      next();
    } catch (error) {
      if (error instanceof Error) {
        // Handle unexpected errors
        logger.error('Rate limiter error:', {
          error: error.message,
          stack: error.stack,
          type,
          socketId: socket.id,
          userId: socket.user?.id
        });
        next(error);
      } else {
        // Rate limit exceeded
        const retryAfter = Math.ceil(error.msBeforeNext / 1000);
        
        // Emit rate limit exceeded event to client
        if (socket.connected) {
          socket.emit('rate_limit_exceeded', {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryAfter,
            limit: effectiveLimiter.points,
            window: effectiveLimiter.duration
          });
        }
        
        // Log the rate limit event
        logger.warn('Rate limit exceeded:', {
          type,
          socketId: socket.id,
          userId: socket.user?.id,
          ip: socket.handshake.address,
          retryAfter
        });
        
        // Close the connection if this is an auth attempt
        if (type === 'auth') {
          socket.disconnect(true);
        }
        
        next(new AppError('Too many requests', 429));
      }
    }
  };
};

/**
 * Middleware to apply rate limiting to specific events
 * @param {object} eventConfigs - Object mapping event names to rate limit configs
 * @example
 * const rateLimitConfig = {
 *   'send_message': { type: 'message' },
 *   'create_notification': { type: 'notification', points: 50, duration: 300 }
 * };
 */
const eventRateLimiter = (eventConfigs) => {
  const limiters = new Map();
  
  // Initialize limiters for each event
  for (const [event, config] of Object.entries(eventConfigs)) {
    limiters.set(event, {
      limiter: new RateLimiterMemory({
        points: config.points || 60,
        duration: config.duration || 60,
        keyPrefix: `socket_event_${event}`
      }),
      keyGenerator: config.keyGenerator
    });
  }
  
  return (socket, next) => {
    // Store original emit function
    const originalEmit = socket.emit;
    
    // Override emit to check rate limits
    socket.emit = function(event, ...args) {
      const config = limiters.get(event);
      
      if (config) {
        // Generate rate limit key
        const key = config.keyGenerator 
          ? config.keyGenerator(socket)
          : `event_${event}_${socket.user?.id || socket.handshake.address}`;
        
        // Check rate limit
        config.limiter.consume(key)
          .then(rateLimitInfo => {
            // Update rate limit info
            socket.rateLimit = {
              ...socket.rateLimit,
              [event]: {
                limit: config.limiter.points,
                remaining: rateLimitInfo.remainingPoints,
                reset: Math.ceil(rateLimitInfo.msBeforeNext / 1000)
              }
            };
            
            // Emit the original event
            originalEmit.apply(socket, [event, ...args]);
          })
          .catch(() => {
            // Rate limit exceeded, don't emit the event
            logger.warn(`Event rate limit exceeded: ${event}`, {
              socketId: socket.id,
              userId: socket.user?.id,
              ip: socket.handshake.address
            });
            
            // Emit rate limit exceeded event
            originalEmit.call(socket, 'rate_limit_exceeded', {
              code: 'EVENT_RATE_LIMIT_EXCEEDED',
              message: `Too many ${event} events, please slow down`,
              event,
              limit: config.limiter.points,
              window: config.limiter.duration
            });
          });
      } else {
        // No rate limiting for this event, emit normally
        originalEmit.apply(socket, [event, ...args]);
      }
    };
    
    next();
  };
};

module.exports = {
  socketRateLimiter,
  eventRateLimiter,
  rateLimiters
};
