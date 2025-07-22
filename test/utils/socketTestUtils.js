const { io } = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');
const { createToken } = require('../../src/utils/tokenUtils');
const { User } = require('../../src/models');

/**
 * Create a test user with a JWT token
 * @param {object} userData - User data to override defaults
 * @returns {Promise<{user: object, token: string}>} User and token
 */
const createTestUser = async (userData = {}) => {
  const testUser = await User.create({
    email: `test-${uuidv4()}@example.com`,
    password: 'Test123!@#', // Must include uppercase, lowercase, number, and special char
    fullName: 'Test User',
    role: 'student',
    isActive: true,
    isEmailVerified: true,
    ...userData
  });

  const token = createToken({
    id: testUser.id,
    email: testUser.email,
    role: testUser.role
  });

  return { user: testUser.get({ plain: true }), token };
};

/**
 * Create a Socket.IO client for testing
 * @param {string} token - JWT token for authentication
 * @param {object} options - Additional options
 * @returns {object} Socket.IO client instance
 */
const createSocketClient = (token, options = {}) => {
  const {
    reconnection = false,
    timeout = 10000,
    path = '/socket.io',
    query = {},
    ...socketOptions
  } = options;

  const client = io('http://localhost:5000', {
    reconnection,
    timeout,
    path,
    query: {
      token,
      ...query
    },
    transports: ['websocket'],
    forceNew: true,
    autoConnect: true,
    ...socketOptions
  });

  // Add helper methods
  client.waitForEvent = (event, timeoutMs = 5000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        client.off(event, eventHandler);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeoutMs);

      const eventHandler = (data) => {
        clearTimeout(timer);
        client.off(event, eventHandler);
        resolve(data);
      };

      client.on(event, eventHandler);
    });
  };

  // Add connection promise
  client.connected = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.off('connect', onConnect);
      client.off('connect_error', onError);
      reject(new Error('Connection timeout'));
    }, 5000);

    const onConnect = () => {
      clearTimeout(timeout);
      client.off('connect_error', onError);
      resolve();
    };

    const onError = (err) => {
      clearTimeout(timeout);
      client.off('connect', onConnect);
      reject(err);
    };

    if (client.connected) {
      onConnect();
    } else {
      client.once('connect', onConnect);
      client.once('connect_error', onError);
    }
  });

  return client;
};

/**
 * Wait for all promises to settle (both resolve and reject)
 * @param {Array<Promise>} promises - Array of promises
 * @returns {Promise<Array>} Array of results with status and value/reason
 */
const settleAll = (promises) => {
  return Promise.all(
    promises.map(p =>
      p.then(
        value => ({ status: 'fulfilled', value }),
        reason => ({ status: 'rejected', reason })
      )
    )
  );
};

/**
 * Wait for a condition to be true
 * @param {function} condition - Function that returns a boolean
 * @param {number} timeout - Timeout in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise<boolean>} True if condition was met, false if timed out
 */
const waitForCondition = async (condition, timeout = 5000, interval = 100) => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
};

/**
 * Clean up test users
 * @param {Array<object>} users - Array of user objects or IDs
 */
const cleanupTestUsers = async (users) => {
  const userIds = users.map(u => (typeof u === 'object' ? u.id : u));
  await User.destroy({ where: { id: userIds }, force: true });
};

module.exports = {
  createTestUser,
  createSocketClient,
  settleAll,
  waitForCondition,
  cleanupTestUsers
};
