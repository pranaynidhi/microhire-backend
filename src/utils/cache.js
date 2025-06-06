const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis(process.env.REDIS_URL);

const cache = {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, expiry = 3600) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', expiry);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  },

  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }
};

module.exports = cache;
