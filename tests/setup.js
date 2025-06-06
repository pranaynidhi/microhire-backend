const { sequelize } = require('../models');
const { redis } = require('../utils/cache');
const logger = require('../utils/logger');
const { getFirebaseAdmin } = require('../src/config/firebase');

// Disable logging during tests
logger.silent = true;

beforeAll(async () => {
  // Sync database
  await sequelize.sync({ force: true });
  // Initialize Firebase Admin for testing
  try {
    const admin = getFirebaseAdmin();
    console.log('Firebase Admin initialized for testing');
  } catch (error) {
    console.error('Error initializing Firebase Admin for testing:', error);
    throw error;
  }
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
  // Close Redis connection
  await redis.quit();
  // Clean up after all tests
  try {
    const admin = getFirebaseAdmin();
    // Delete any test users that might have been created
    const listUsersResult = await admin.auth().listUsers();
    const testUsers = listUsersResult.users.filter(user => 
      user.email.endsWith('@test.com')
    );
    
    for (const user of testUsers) {
      await admin.auth().deleteUser(user.uid);
    }
    
    console.log('Test cleanup completed');
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

// Clean up database after each test
afterEach(async () => {
  await sequelize.truncate({ cascade: true });
});
