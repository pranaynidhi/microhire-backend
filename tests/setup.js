const { sequelize } = require('../models');
const { redis } = require('../utils/cache');
const logger = require('../utils/logger');

// Disable logging during tests
logger.silent = true;

beforeAll(async () => {
  // Sync database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
  // Close Redis connection
  await redis.quit();
});

// Clean up database after each test
afterEach(async () => {
  await sequelize.truncate({ cascade: true });
});
