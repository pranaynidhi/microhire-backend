const { execSync } = require('child_process');
const { sequelize, initializeDatabase, syncDatabase } = require('../src/models');
const { sequelize: testSequelize, testConnection } = require('../src/config/test-database');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.TEST_DB_NAME = 'microhire_test';
process.env.TEST_DB_USER = 'root';
process.env.TEST_DB_PASSWORD = '';
process.env.TEST_DB_HOST = 'localhost';
process.env.TEST_DB_PORT = '3306';

// Global test setup
beforeAll(async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to test database');
    }

    // Sync test database
    await syncDatabase({ force: true });
    
    // Run migrations if needed (using Sequelize sync instead of migrations for tests)
    try {
      await sequelize.sync({ force: true });
    } catch (syncError) {
      console.error('Database sync error:', syncError.message);
      throw syncError;
    }
    
    // Seed test data if needed
    try {
      // You can add test data seeding here if needed
    } catch (seedError) {
      console.warn('Seeding warning:', seedError.message);
    }
  } catch (error) {
    console.error('Test setup error:', error);
    process.exit(1);
  }
});

// Global test teardown
afterAll(async () => {
  try {
    // Close database connections
    await Promise.all([
      sequelize.close(),
      testSequelize.close()
    ]);
  } catch (error) {
    console.error('Test teardown error:', error);
  }
});

// Global test timeout
jest.setTimeout(60000); // Increased timeout for database operations

// Mock external services
jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
}));

// Mock Redis for tests
jest.mock('../src/utils/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(),
  isReady: true,
}));

// Add global test utilities
global.createTestUser = async (userData = {}) => {
  const User = require('../src/models').User;
  const { generateTokens } = require('../src/controllers/authController');
  
  const user = await User.create({
    fullName: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    role: 'student',
    isActive: true,
    emailVerified: true,
    ...userData
  });
  
  const { accessToken } = generateTokens(user.id);
  
  return {
    user: user.get({ plain: true }),
    token: `Bearer ${accessToken}`
  };
};

// Add custom matchers
expect.extend({
  toBeOneOf(received, items) {
    const pass = items.includes(received);
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be one of [${items.join(', ')}]`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be one of [${items.join(', ')}]`,
        pass: false,
      };
    }
  },
});
