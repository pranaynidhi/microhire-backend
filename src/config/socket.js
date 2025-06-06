const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const { User } = require('../models');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e8
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new AppError('Authentication token required', 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new AppError('Authentication failed', 401));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.id}`);

    // Join user's room
    socket.join(socket.user.id);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.user.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
      socket.emit('error', { message: 'Internal server error' });
    });

    // Handle reconnection
    socket.on('reconnect_attempt', (attemptNumber) => {
      logger.info(`Reconnection attempt ${attemptNumber} for user: ${socket.user.id}`);
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, message } = data;
        
        // Validate message
        if (!message || !recipientId) {
          throw new AppError('Invalid message data', 400);
        }

        // Emit to recipient
        io.to(recipientId).emit('receive_message', {
          senderId: socket.user.id,
          message,
          timestamp: new Date()
        });

        // Emit confirmation to sender
        socket.emit('message_sent', {
          recipientId,
          message,
          timestamp: new Date()
        });

        logger.info(`Message sent from ${socket.user.id} to ${recipientId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle typing status
    socket.on('typing', (data) => {
      const { recipientId, isTyping } = data;
      io.to(recipientId).emit('user_typing', {
        userId: socket.user.id,
        isTyping
      });
    });

    // Handle read receipts
    socket.on('message_read', (data) => {
      const { senderId, messageId } = data;
      io.to(senderId).emit('message_read_receipt', {
        messageId,
        readBy: socket.user.id,
        timestamp: new Date()
      });
    });
  });

  // Error handling
  io.engine.on('connection_error', (error) => {
    logger.error('Socket connection error:', error);
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new AppError('Socket.IO not initialized', 500);
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};
