const { v4: uuidv4 } = require('uuid');
const { User, sequelize } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');

/**
 * Generate a random email for testing
 * @returns {string} Random email
 */
const generateTestEmail = () => {
  return `test-${uuidv4()}@test.com`;
};

/**
 * Create a test user with the given role
 * @param {Object} options - User options
 * @param {string} [options.role='student'] - User role (student, business, admin)
 * @param {boolean} [options.emailVerified=true] - Whether the user's email is verified
 * @param {boolean} [options.isActive=true] - Whether the user is active
 * @returns {Promise<Object>} Created user and auth token
 */
const createTestUser = async (options = {}) => {
  const {
    role = 'student',
    emailVerified = true,
    isActive = true,
    ...userData
  } = options;

  const user = await User.create({
    fullName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    email: generateTestEmail(),
    password: 'Test123!@#',
    role,
    isActive,
    emailVerified,
    ...(role === 'business' && { companyName: 'Test Company' }),
    ...userData,
  });

  const { accessToken, refreshToken } = generateTokens(user.id);
  
  return {
    user: user.get({ plain: true }),
    token: `Bearer ${accessToken}`,
    refreshToken,
  };
};

/**
 * Clean up test data
 * @param {Array<import('sequelize').Model>} models - Models to clean up
 * @returns {Promise<void>}
 */
const cleanupTestData = async (models = []) => {
  // Ensure we have an array of models
  const modelsToClean = Array.isArray(models) ? models : [models];
  
  // Delete all data from each model
  for (const model of modelsToClean) {
    if (model && typeof model.destroy === 'function') {
      await model.destroy({ where: {}, force: true });
    }
  }
};

/**
 * Truncate all tables in the test database
 * @returns {Promise<void>}
 */
const truncateAllTables = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableNames = Object.values(sequelize.models)
    .map(model => model.tableName)
    .filter((value, index, self) => self.indexOf(value) === index);

  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  
  for (const tableName of tableNames) {
    await queryInterface.bulkDelete(tableName, {}, { truncate: true, cascade: true, force: true });
  }
  
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
};

/**
 * Create a test server instance
 * @returns {Promise<import('http').Server>} Test server instance
 */
const createTestServer = async () => {
  const { server } = require('./setupTestEnv');
  await server.start();
  return server;
};

/**
 * Close the test server
 * @param {import('http').Server} server - Server instance to close
 * @returns {Promise<void>}
 */
const closeTestServer = async (server) => {
  if (server && typeof server.close === 'function') {
    await server.close();
  }
};

module.exports = {
  generateTestEmail,
  createTestUser,
  cleanupTestData,
  truncateAllTables,
  createTestServer,
  closeTestServer,
};
