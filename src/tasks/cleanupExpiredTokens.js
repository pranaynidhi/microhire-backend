const cron = require('node-cron');
const { cleanupExpiredTokens } = require('../services/tokenService');
const logger = require('../utils/logger');

/**
 * Schedule cleanup of expired blacklisted tokens
 * Runs daily at 3 AM by default
 */
const scheduleTokenCleanup = (cronExpression = '0 3 * * *') => {
  // Schedule the task
  const task = cron.schedule(cronExpression, async () => {
    try {
      logger.info('Starting cleanup of expired blacklisted tokens...');
      const count = await cleanupExpiredTokens();
      logger.info(`Successfully cleaned up ${count} expired blacklisted tokens`);
    } catch (error) {
      logger.error('Error during token cleanup task:', { 
        error: error.message, 
        stack: error.stack 
      });
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Log when the task is scheduled
  logger.info(`Scheduled token cleanup task with cron expression: ${cronExpression}`);
  
  return task;
};

module.exports = {
  scheduleTokenCleanup
};
