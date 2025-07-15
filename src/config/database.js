const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

// Debug: Log the database configuration
console.log('🔍 Database Config Debug:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : '***NOT SET***');
console.log('NODE_ENV:', process.env.NODE_ENV);

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
    console.log('🔌 Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    logger.info('Database connection established successfully');

    // Sync database (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Syncing database in development mode...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized');
      logger.info('Database synchronized');
    }

    // Handle connection events
    sequelize.connectionManager.on('disconnect', () => {
      console.log('⚠️ Database disconnected. Attempting to reconnect...');
      logger.warn('Database disconnected. Attempting to reconnect...');
      setTimeout(connectDB, 5000);
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await sequelize.close();
        console.log('🔌 Database connection closed through app termination');
        logger.info('Database connection closed through app termination');
        if (process.env.NODE_ENV === 'test') {
          // Do not exit during tests
          console.error('Test mode: would call process.exit');
        } else {
          process.exit(0);
        }
      } catch (err) {
        console.error('❌ Error during database connection closure:', err);
        logger.error('Error during database connection closure:', err);
        if (process.env.NODE_ENV === 'test') {
          // Do not exit during tests
          console.error('Test mode: would call process.exit');
        } else {
          process.exit(1);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    logger.error('Error connecting to database:', error);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
