// If you get MODULE_NOT_FOUND for 'web-push', run: npm install web-push
const webpush = require('web-push');

// Configure web push
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@microhire.com'}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to a subscription
 * @param {Object} subscription - Push subscription object
 * @param {Object} payload - Notification payload
 * @returns {Promise} Promise that resolves when notification is sent
 */
const sendNotification = async (subscription, payload) => {
  try {
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true, result };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to multiple subscriptions
 * @param {Array} subscriptions - Array of push subscription objects
 * @param {Object} payload - Notification payload
 * @returns {Promise<Array>} Array of results for each subscription
 */
const sendNotificationToMany = async (subscriptions, payload) => {
  const results = [];

  for (const subscription of subscriptions) {
    const result = await sendNotification(subscription, payload);
    results.push(result);
  }

  return results;
};

/**
 * Validate push subscription
 * @param {Object} subscription - Push subscription object
 * @returns {boolean} True if subscription is valid
 */
const validateSubscription = (subscription) =>
  subscription &&
  subscription.endpoint &&
  subscription.keys &&
  subscription.keys.p256dh &&
  subscription.keys.auth;

module.exports = {
  webpush,
  sendNotification,
  sendNotificationToMany,
  validateSubscription,
};
