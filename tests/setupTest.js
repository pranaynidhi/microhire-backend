// Load environment variables from .env file
require('dotenv').config({ path: '.env.test' });

const express = require('express');
const http = require('http');
const models = require('../src/models');
const { sequelize } = models;
const logger = require('../src/utils/logger');
const errorHandler = require('../src/middleware/errorHandler');

// Set test environment variables before importing modules that use them
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use a different DB for tests
process.env.PORT = 0; // Use random port for tests

// Mock Redis for tests to avoid connection issues
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(),
  isReady: true,
};

jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => mockRedis),
}));

// Mock nodemailer for tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

// Mock realtime service to prevent notification errors
const mockRealtimeService = {
  sendNotificationToUser: jest.fn().mockResolvedValue(true),
  sendMessageNotification: jest.fn().mockResolvedValue(true),
  sendApplicationUpdate: jest.fn().mockResolvedValue(true),
  broadcastInternshipUpdate: jest.fn().mockResolvedValue(true),
  sendSystemAnnouncement: jest.fn().mockResolvedValue(true),
  getOnlineUsersCount: jest.fn().mockReturnValue(0),
  sendUserStatusUpdate: jest.fn().mockResolvedValue(true),
  initialize: jest.fn().mockResolvedValue(true),
};

jest.mock('../src/services/realtimeService', () => ({
  RealtimeService: jest.fn().mockImplementation(() => mockRealtimeService),
  initializeRealtimeService: jest.fn().mockResolvedValue(mockRealtimeService),
  getRealtimeService: jest.fn().mockReturnValue(mockRealtimeService),
}));

// Mock file uploads for tests
jest.mock('../src/middleware/upload', () => ({
  upload: {
    single: () => (req, res, next) => next(),
    array: () => (req, res, next) => next(),
    fields: () => (req, res, next) => next(),
  },
  fileFilter: (req, file, cb) => cb(null, true),
}));

// Mock rate limiting for tests
jest.mock('express-rate-limit', () => ({
  rateLimit: () => (req, res, next) => next(),
}));

// Mock CSRF protection for tests
jest.mock('csurf', () => () => (req, res, next) => {
  req.csrfToken = () => 'test-csrf-token';
  next();
});

// Initialize the Express app
const app = express();
const server = http.createServer(app);

// Apply middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Apply routes
app.use('/api', require('../src/routes'));

// Error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Export the server for testing
module.exports = {
  server,
  app,
  start: async () => {
    // Sync database before starting the server
    await sequelize.sync({ force: true });
    
    return new Promise((resolve) => {
      server.listen(0, () => {
        const { port } = server.address();
        process.env.TEST_SERVER_URL = `http://localhost:${port}`;
        logger.info(`Test server running on port ${port}`);
        resolve(server);
      });
    });
  },
  close: async () => {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  },
  mockRedis,
  mockRealtimeService,
};

// Create a lightweight test app instead of importing the full server
const app = express();
app.use(express.json());

// Import and use all routes (without heavy initialization)
const authRoutes = require('../src/routes/auth');
const userRoutes = require('../src/routes/users');
const internshipRoutes = require('../src/routes/internships');
const applicationRoutes = require('../src/routes/applications');
const messageRoutes = require('../src/routes/messages');
const notificationRoutes = require('../src/routes/notifications');
const uploadRoutes = require('../src/routes/upload');
const reviewRoutes = require('../src/routes/reviews');
const certificateRoutes = require('../src/routes/certificates');
const analyticsRoutes = require('../src/routes/analytics');
const adminRoutes = require('../src/routes/admin');
const searchRoutes = require('../src/routes/search');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

// Error handling middleware
app.use(errorHandler);

// Create HTTP server for tests that need it
const server = http.createServer(app);

// Disable logging during tests
if (logger && typeof logger === 'object') {
  logger.silent = true;
}

beforeAll(async () => {
  // Sync database with increased timeout
  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    logger.error('Database sync failed:', error);
    throw error;
  }
}, 30000); // 30 second timeout

afterAll(async () => {
  // Close server
  server.close();
  // Close database connection
  try {
    await sequelize.close();
  } catch (error) {
    logger.error('Database close failed:', error);
  }
  // Close Redis connection if available
  if (redis && typeof redis.quit === 'function') {
    try {
      await redis.quit();
    } catch (e) {}
  }
});

// Clean up database after each test
afterEach(async () => {
  try {
    await sequelize.truncate({ cascade: true });
  } catch (error) {
    logger.error('Database truncate failed:', error);
  }
});

module.exports = { app, server };
