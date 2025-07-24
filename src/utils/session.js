const { v4: uuidv4 } = require('uuid');
const cache = require('./cache');

const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';

/**
 * Create a new session in Redis
 * @param {Object} params - { userId, device, ip, userAgent, refreshToken }
 * @returns {string} sessionId
 */
async function createSession({ userId, device, ip, userAgent, refreshToken }) {
  const sessionId = uuidv4();
  const sessionKey = SESSION_PREFIX + sessionId;
  const now = new Date().toISOString();
  const sessionData = {
    sessionId,
    userId,
    device,
    ip,
    userAgent,
    refreshToken,
    createdAt: now,
    lastActive: now,
  };
  await cache.set(sessionKey, sessionData, 60 * 60 * 24 * 7); // 7 days expiry
  // Add sessionId to user's session list
  const userSessionsKey = USER_SESSIONS_PREFIX + userId;
  let userSessions = await cache.get(userSessionsKey) || [];
  userSessions.push(sessionId);
  await cache.set(userSessionsKey, userSessions, 60 * 60 * 24 * 7);
  return sessionId;
}

/**
 * Get all sessions for a user
 */
async function getSessionsByUser(userId) {
  const userSessionsKey = USER_SESSIONS_PREFIX + userId;
  const sessionIds = await cache.get(userSessionsKey) || [];
  const sessions = [];
  for (const sessionId of sessionIds) {
    const session = await cache.get(SESSION_PREFIX + sessionId);
    if (session) sessions.push(session);
  }
  return sessions;
}

/**
 * Get a session by sessionId
 */
async function getSession(sessionId) {
  return cache.get(SESSION_PREFIX + sessionId);
}

/**
 * Remove a session by sessionId
 */
async function removeSession(userId, sessionId) {
  await cache.del(SESSION_PREFIX + sessionId);
  // Remove from user's session list
  const userSessionsKey = USER_SESSIONS_PREFIX + userId;
  let userSessions = await cache.get(userSessionsKey) || [];
  userSessions = userSessions.filter(id => id !== sessionId);
  await cache.set(userSessionsKey, userSessions, 60 * 60 * 24 * 7);
}

/**
 * Update lastActive for a session
 */
async function updateSessionLastActive(sessionId) {
  const sessionKey = SESSION_PREFIX + sessionId;
  const session = await cache.get(sessionKey);
  if (session) {
    session.lastActive = new Date().toISOString();
    await cache.set(sessionKey, session, 60 * 60 * 24 * 7);
  }
}

module.exports = {
  createSession,
  getSessionsByUser,
  getSession,
  removeSession,
  updateSessionLastActive,
}; 