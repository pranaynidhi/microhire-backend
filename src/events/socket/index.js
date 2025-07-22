const socketIO = require('socket.io');
const { authenticateSocket } = require('./middleware/authentication');
const { socketErrorHandler } = require('./middleware/errorHandler');
const handlers = require('./handlers');
const logger = require('../../utils/logger');

class SocketService {
  constructor(server) {
    if (!server) {
      throw new Error('HTTP server instance is required');
    }
    
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      maxHttpBufferSize: 1e8 // 100MB max message size for file uploads
    });
    
    this.initialize();
  }
  
  initialize() {
    // Apply authentication middleware
    this.io.use(authenticateSocket());
    
    // Handle connection
    this.io.on('connection', (socket) => {
      const userId = socket.user?.id || 'unknown';
      logger.info(`User connected: ${userId} (Socket ID: ${socket.id})`);
      
      // Register event handlers
      this.registerHandlers(socket);
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`User disconnected: ${userId} (Reason: ${reason})`);
        
        // Leave all rooms
        const rooms = Object.keys(socket.rooms);
        if (rooms.length > 1) { // socket always joins its own room by ID
          rooms.forEach(room => {
            if (room !== socket.id) { // Don't leave the default room
              socket.leave(room);
            }
          });
        }
      });
      
      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error:', {
          error: error.message,
          stack: error.stack,
          userId,
          socketId: socket.id
        });
      });
    });
    
    logger.info('Socket.IO server initialized');
  }
  
  registerHandlers(socket) {
    // Register all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, async (...args) => {
        try {
          // If handler is an array (middleware chain), execute each in sequence
          if (Array.isArray(handler)) {
            let lastResult = args[0]; // Initial data is first argument
            
            for (const fn of handler) {
              // If this is the last function, pass the socket as first argument
              if (handler.indexOf(fn) === handler.length - 1) {
                lastResult = await fn(socket, lastResult);
              } else {
                lastResult = await fn(lastResult);
              }
              
              // If any middleware returns null/undefined, stop the chain
              if (lastResult === null || lastResult === undefined) {
                return;
              }
            }
            
            // If the last handler returns a result, send it back to the client
            if (lastResult !== undefined && event !== 'typing') {
              socket.emit(`${event}_result`, lastResult);
            }
          } 
          // If handler is a single function, just call it
          else if (typeof handler === 'function') {
            const result = await handler(socket, ...args);
            if (result !== undefined && event !== 'typing') {
              socket.emit(`${event}_result`, result);
            }
          }
        } catch (error) {
          // Handle any errors that occur during event handling
          socketErrorHandler(error, socket, event, ...args);
        }
      });
    });
  }
  
  /**
   * Get the Socket.IO server instance
   */
  getIO() {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }
    return this.io;
  }
  
  /**
   * Get all connected sockets
   */
  getSockets() {
    return this.io?.sockets?.sockets || new Map();
  }
  
  /**
   * Get all connected users
   */
  getConnectedUsers() {
    const sockets = this.getSockets();
    const users = new Set();
    
    for (const [_, socket] of sockets) {
      if (socket.user?.id) {
        users.add(socket.user.id);
      }
    }
    
    return Array.from(users);
  }
  
  /**
   * Send an event to a specific user
   */
  sendToUser(userId, event, data) {
    if (!this.io) return false;
    
    this.io.to(`user_${userId}`).emit(event, data);
    return true;
  }
  
  /**
   * Send an event to all connected users
   */
  broadcast(event, data) {
    if (!this.io) return false;
    
    this.io.emit(event, data);
    return true;
  }
  
  /**
   * Send an event to all users in a room
   */
  sendToRoom(room, event, data) {
    if (!this.io) return false;
    
    this.io.to(room).emit(event, data);
    return true;
  }
  
  /**
   * Close the Socket.IO server
   */
  close() {
    if (this.io) {
      this.io.close();
      this.io = null;
      logger.info('Socket.IO server closed');
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Initialize the Socket.IO service
 */
const initializeSocketIO = (server) => {
  if (!instance) {
    instance = new SocketService(server);
  }
  return instance;
};

/**
 * Get the Socket.IO service instance
 */
const getSocketService = () => {
  if (!instance) {
    throw new Error('Socket.IO service not initialized. Call initializeSocketIO first.');
  }
  return instance;
};

module.exports = {
  SocketService,
  initializeSocketIO,
  getSocketService
};
