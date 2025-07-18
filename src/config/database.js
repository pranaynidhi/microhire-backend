const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

// Debug: Log the database configuration
logger.debug('Database Config Debug:');
logger.debug('DB_HOST:', process.env.DB_HOST);
logger.debug('DB_PORT:', process.env.DB_PORT);
logger.debug('DB_NAME:', process.env.DB_NAME);
logger.debug('DB_USER:', process.env.DB_USER);
logger.debug('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : '***NOT SET***');
logger.debug('NODE_ENV:', process.env.NODE_ENV);

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft deletes
  },
});

const connectDB = async () => {
  try {
    logger.info('Attempting to connect to database...');
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync database (in development)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Syncing database in development mode...');
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }

    // Handle connection events
    sequelize.connectionManager.on('disconnect', () => {
      logger.warn('Database disconnected. Attempting to reconnect...');
      setTimeout(connectDB, 5000);
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await sequelize.close();
        logger.info('Database connection closed through app termination');
        if (process.env.NODE_ENV === 'test') {
          // Do not exit during tests
          logger.error('Test mode: would call process.exit');
        } else {
          process.exit(0);
        }
      } catch (err) {
        logger.error('Error during database connection closure:', err);
        if (process.env.NODE_ENV === 'test') {
          // Do not exit during tests
          logger.error('Test mode: would call process.exit');
        } else {
          process.exit(1);
        }
      }
    });
  } catch (error) {
    logger.error('Error connecting to database:', error);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
