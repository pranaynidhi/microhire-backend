const { scheduleTokenCleanup } = require('./cleanupExpiredTokens');
const logger = require('../utils/logger');

/**
 * Initialize all scheduled tasks
 */
const initScheduledTasks = () => {
  try {
    // Schedule token cleanup task (runs daily at 3 AM UTC by default)
    scheduleTokenCleanup(process.env.TOKEN_CLEANUP_CRON || '0 3 * * *');
    
    logger.info('Scheduled tasks initialized');
  } catch (error) {
    logger.error('Failed to initialize scheduled tasks:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  initScheduledTasks
};
