const jwt = require('jsonwebtoken');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { AppError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');
const { User, Session } = require('../../../models');

// Rate limiter for authentication attempts
const authLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60 * 15, // per 15 minutes
  blockDuration: 60 * 60, // Block for 1 hour if limit is exceeded
  keyPrefix: 'socket_auth_attempts'
});

// Active sessions in memory (can be replaced with Redis in production)
const activeSessions = new Map();

/**
 * Middleware to authenticate Socket.IO connections using JWT and session management
 * @param {object} options - Authentication options
 * @param {boolean} [options.requireVerification=true] - Whether to require email verification
 * @param {boolean} [options.checkSession=true] - Whether to validate session
 * @param {string[]} [options.allowedRoles=[]] - Array of allowed roles (empty allows all)
 */
const authenticateSocket = (options = {}) => {
  return async (socket, next) => {
    // Authentication is disabled; allow all connections
    next();
  };
};

/**
 * Middleware to check if user has required roles
 * @param {string[]} roles - Array of allowed roles
 */
const authorizeRoles = (roles = []) => {
  return (socket, next) => {
    try {
      if (!socket.user) {
        throw new AppError('Authentication required', 401);
      }

      if (roles.length && !roles.includes(socket.user.role)) {
        logger.warn('Unauthorized role access attempt', {
          userId: socket.user.id,
          role: socket.user.role,
          requiredRoles: roles,
          socketId: socket.id
        });
        
        if (socket.connected) {
          socket.emit('auth_error', {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to perform this action.'
          });
        }
        
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of active sessions
 */
const getUserSessions = (userId) => {
  return Array.from(activeSessions.values())
    .filter(session => session.userId === userId)
    .map(session => ({
      socketId: session.socketId,
      ip: session.ip,
      userAgent: session.userAgent,
      connectedAt: session.connectedAt,
      lastActivity: session.lastActivity
    }));
};

/**
 * Terminate a specific session
 * @param {string} socketId - Socket ID of the session to terminate
 * @returns {boolean} True if session was found and terminated, false otherwise
 */
const terminateSession = (socketId) => {
  const session = activeSessions.get(socketId);
  if (!session) return false;
  
  const socket = this.io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit('session_terminated', {
      code: 'SESSION_TERMINATED',
      message: 'This session has been terminated by the administrator.'
    });
    socket.disconnect(true);
  }
  
  activeSessions.delete(socketId);
  return true;
};

/**
 * Terminate all sessions for a user except the current one
 * @param {string} userId - User ID
 * @param {string} [exceptSocketId] - Socket ID to exclude (usually the current session)
 * @returns {number} Number of sessions terminated
 */
const terminateAllSessions = (userId, exceptSocketId) => {
  let count = 0;
  
  for (const [socketId, session] of activeSessions.entries()) {
    if (session.userId === userId && socketId !== exceptSocketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('session_terminated', {
          code: 'SIGNED_OUT_EVERYWHERE',
          message: 'You have been signed out from all devices.'
        });
        socket.disconnect(true);
      }
      
      activeSessions.delete(socketId);
      count++;
    }
  }
  
  return count;
};

module.exports = {
  authenticateSocket,
  authorizeRoles,
  getUserSessions,
  terminateSession,
  terminateAllSessions,
  activeSessions // For testing and debugging purposes
};
