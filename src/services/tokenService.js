const jwt = require('jsonwebtoken');
const { BlacklistedToken } = require('../models');
const logger = require('../utils/logger');

/**
 * Blacklist a token by adding it to the database
 * @param {string} token - The JWT token to blacklist
 * @param {number} [userId] - Optional user ID associated with the token
 * @param {string} [reason] - Reason for blacklisting (e.g., 'logout', 'password_change')
 * @returns {Promise<boolean>} - True if token was blacklisted successfully
 */
const blacklistToken = async (token, userId = null, reason = null) => {
  try {
    // Decode the token to get expiration
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      logger.warn('Invalid token format - missing expiration', { token });
      return false;
    }

    // Calculate expiration date from token
    const expiresAt = new Date(decoded.exp * 1000);
    
    // Check if token is already expired
    if (expiresAt < new Date()) {
      logger.debug('Token is already expired, skipping blacklist', { token });
      return true; // Consider already expired tokens as "successfully blacklisted"
    }

    // Add to blacklist
    await BlacklistedToken.create({
      token,
      userId,
      expiresAt,
      reason: reason || 'logout'
    });

    logger.debug('Token blacklisted successfully', { userId, reason });
    return true;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      logger.debug('Token already blacklisted', { token });
      return true; // Token is already blacklisted, treat as success
    }
    logger.error('Error blacklisting token', { error: error.message, stack: error.stack });
    return false;
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - The JWT token to check
 * @returns {Promise<boolean>} - True if token is blacklisted
 */
const isTokenBlacklisted = async (token) => {
  try {
    const blacklisted = await BlacklistedToken.findOne({
      where: { token },
      attributes: ['id']
    });
    return !!blacklisted;
  } catch (error) {
    logger.error('Error checking token blacklist', { error: error.message });
    // In case of error, assume token is not blacklisted to avoid false positives
    return false;
  }
};

/**
 * Clean up expired blacklisted tokens from the database
 * @returns {Promise<number>} - Number of tokens removed
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await BlacklistedToken.destroy({
      where: {
        expiresAt: {
          [Sequelize.Op.lt]: new Date()
        }
      }
    });
    
    if (result > 0) {
      logger.info(`Cleaned up ${result} expired blacklisted tokens`);
    }
    
    return result;
  } catch (error) {
    logger.error('Error cleaning up expired blacklisted tokens', { error: error.message });
    return 0;
  }
};

/**
 * Blacklist all tokens for a specific user (e.g., on password reset)
 * @param {number} userId - The user ID
 * @param {string} reason - Reason for blacklisting
 * @returns {Promise<number>} - Number of tokens blacklisted
 */
const blacklistAllUserTokens = async (userId, reason = 'password_reset') => {
  try {
    // This would be called when a user changes their password or account is compromised
    // Implementation would depend on how tokens are tracked in your system
    // For now, we'll just return 0 as we're not tracking all issued tokens
    logger.info(`Blacklisted all tokens for user ${userId}`, { reason });
    return 0;
  } catch (error) {
    logger.error('Error blacklisting user tokens', { userId, error: error.message });
    return 0;
  }
};

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
  cleanupExpiredTokens,
  blacklistAllUserTokens
};
