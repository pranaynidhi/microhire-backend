const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Test database configuration
const testConfig = {
  database: process.env.TEST_DB_NAME || 'microhire_test',
  username: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || '',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 3306,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'test' ? false : (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
};

// Create test database connection
const sequelize = new Sequelize(
  testConfig.database,
  testConfig.username,
  testConfig.password,
  {
    host: testConfig.host,
    port: testConfig.port,
    dialect: testConfig.dialect,
    logging: testConfig.logging,
    pool: testConfig.pool,
    define: testConfig.define,
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Test database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the test database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  config: testConfig,
};
