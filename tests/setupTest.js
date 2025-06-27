const { sequelize } = require('../src/models');
const redis = require('../src/utils/cache');
const logger = require('../src/utils/logger');

// Disable logging during tests
if (logger && typeof logger === 'object') {
  logger.silent = true;
}

beforeAll(async () => {
  // Sync database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
  // Close Redis connection if available
  if (redis && typeof redis.quit === 'function') {
    try {
      await redis.quit();
    } catch (e) {}
  }
});

// Clean up database after each test
afterEach(async () => {
  await sequelize.truncate({ cascade: true });
}); 