const admin = require('firebase-admin');

class PushNotificationService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    this.messaging = admin.messaging();
  }

  async sendPushNotification(token, title, body, data = {}) {
    try {
      const message = {
        token,
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      return response;
    } catch (error) {
      console.error('Send push notification error:', error);
      throw error;
    }
  }

  async sendToMultipleDevices(tokens, title, body, data = {}) {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data,
        tokens,
      };

      const response = await this.messaging.sendMulticast(message);
      return response;
    } catch (error) {
      console.error('Send multiple push notifications error:', error);
      throw error;
    }
  }
}

module.exports = new PushNotificationService();
