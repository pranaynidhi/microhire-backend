// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const models = require('../src/models');

const { sequelize } = models;
const logger = require('../src/utils/logger');
const errorHandler = require('../src/middleware/errorHandler');

// Set test environment variables before importing modules that use them
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.REDIS_URL = 'redis://localhost:6379'; // Use a test Redis instance or mock

// Mock Redis for tests to avoid connection issues
jest.mock('../src/utils/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  quit: jest.fn(),
}));

// Mock realtime service to prevent notification errors
jest.mock('../src/services/realtimeService', () => ({
  RealtimeService: jest.fn(),
  initializeRealtimeService: jest.fn(() => ({
    sendNotificationToUser: jest.fn(),
    sendMessageNotification: jest.fn(),
    sendApplicationUpdate: jest.fn(),
    broadcastInternshipUpdate: jest.fn(),
    sendSystemAnnouncement: jest.fn(),
    getOnlineUsersCount: jest.fn(() => 0),
    sendUserStatusUpdate: jest.fn(),
  })),
  getRealtimeService: jest.fn(() => ({
    sendNotificationToUser: jest.fn(),
    sendMessageNotification: jest.fn(),
    sendApplicationUpdate: jest.fn(),
    broadcastInternshipUpdate: jest.fn(),
    sendSystemAnnouncement: jest.fn(),
    getOnlineUsersCount: jest.fn(() => 0),
    sendUserStatusUpdate: jest.fn(),
  })),
}));

const redis = require('../src/utils/cache');

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
