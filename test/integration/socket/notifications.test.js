const { createTestUser, createSocketClient, cleanupTestUsers } = require('../../utils/socketTestUtils');
const { Notification, User } = require('../../../src/models');
const { Op } = require('sequelize');

// Increase timeout for all tests in this file
jest.setTimeout(30000);

describe('Socket.IO Notifications', () => {
  let testUsers = [];
  
  // Create test data before all tests
  beforeAll(async () => {
    // Create test users
    const [user1, user2] = await Promise.all([
      createTestUser({ role: 'student' }),
      createTestUser({ role: 'employer' })
    ]);
    
    testUsers.push(user1.user, user2.user);
  });
  
  // Clean up test data
  afterAll(async () => {
    await Notification.destroy({ where: {}, force: true });
    await cleanupTestUsers(testUsers);
  });
  
  describe('Real-time Notifications', () => {
    it('should receive real-time notifications', async () => {
      const [sender, receiver] = testUsers;
      
      // Create socket client for the receiver
      const receiverClient = createSocketClient(receiver.user.token);
      
      try {
        await receiverClient.connected;
        
        // Set up notification listener
        const notificationPromise = new Promise((resolve) => {
          receiverClient.on('notification', (notification) => {
            if (notification.type === 'test_notification') {
              resolve(notification);
            }
          });
        });
        
        // Simulate a notification being created (e.g., by another service)
        const testNotification = await Notification.create({
          userId: receiver.user.id,
          type: 'test_notification',
          title: 'Test Notification',
          message: 'This is a test notification',
          data: { test: true },
          isRead: false
        });
        
        // Wait for the notification to be received
        const receivedNotification = await notificationPromise;
        
        // Verify the notification
        expect(receivedNotification).toMatchObject({
          id: testNotification.id.toString(),
          userId: receiver.user.id.toString(),
          type: 'test_notification',
          title: 'Test Notification',
          message: 'This is a test notification',
          data: { test: true },
          isRead: false
        });
        
      } finally {
        receiverClient.disconnect();
      }
    });
    
    it('should mark notifications as read when acknowledged', async () => {
      const [sender, receiver] = testUsers;
      
      // Create a test notification
      const testNotification = await Notification.create({
        userId: receiver.user.id,
        type: 'unread_notification',
        title: 'Unread Notification',
        message: 'This should be marked as read',
        isRead: false
      });
      
      // Create socket client for the receiver
      const receiverClient = createSocketClient(receiver.user.token);
      
      try {
        await receiverClient.connected;
        
        // Set up notification update listener
        const updatePromise = new Promise((resolve) => {
          receiverClient.on('notification_updated', (update) => {
            if (update.id === testNotification.id && update.isRead) {
              resolve(update);
            }
          });
        });
        
        // Mark the notification as read
        receiverClient.emit('mark_notification_read', {
          notificationId: testNotification.id
        });
        
        // Wait for the update
        const updatedNotification = await updatePromise;
        
        // Verify the update
        expect(updatedNotification).toMatchObject({
          id: testNotification.id.toString(),
          isRead: true
        });
        
        // Verify in the database
        const dbNotification = await Notification.findByPk(testNotification.id);
        expect(dbNotification.isRead).toBe(true);
        
      } finally {
        receiverClient.disconnect();
      }
    });
    
    it('should batch send unread notifications on connect', async () => {
      const [sender, receiver] = testUsers;
      
      // Create several unread notifications
      const unreadNotifications = await Notification.bulkCreate([
        {
          userId: receiver.user.id,
          type: 'batch_test_1',
          title: 'Batch Test 1',
          message: 'First unread notification',
          isRead: false,
          createdAt: new Date(Date.now() - 10000)
        },
        {
          userId: receiver.user.id,
          type: 'batch_test_2',
          title: 'Batch Test 2',
          message: 'Second unread notification',
          isRead: false,
          createdAt: new Date(Date.now() - 5000)
        }
      ]);
      
      // Create socket client for the receiver
      const receiverClient = createSocketClient(receiver.user.token);
      
      try {
        // Set up notification batch listener
        const batchPromise = new Promise((resolve) => {
          const receivedNotifications = [];
          
          receiverClient.on('notifications_batch', (batch) => {
            receivedNotifications.push(...batch);
            
            // Resolve when we've received all expected notifications
            if (receivedNotifications.length >= unreadNotifications.length) {
              resolve(receivedNotifications);
            }
          });
        });
        
        // Wait for the batch of notifications
        const receivedBatch = await batchPromise;
        
        // Verify we received all unread notifications
        expect(receivedBatch.length).toBeGreaterThanOrEqual(unreadNotifications.length);
        
        // Check that our test notifications are in the batch
        const receivedIds = receivedBatch.map(n => n.id);
        for (const notification of unreadNotifications) {
          expect(receivedIds).toContain(notification.id.toString());
        }
        
      } finally {
        receiverClient.disconnect();
        
        // Clean up test notifications
        await Notification.destroy({
          where: {
            id: unreadNotifications.map(n => n.id)
          }
        });
      }
    });
  });
  
  describe('Notification Preferences', () => {
    it('should respect user notification preferences', async () => {
      const [sender, receiver] = testUsers;
      
      // Update user preferences to disable email notifications
      await User.update(
        { notificationPreferences: { email: false, push: true } },
        { where: { id: receiver.user.id } }
      );
      
      // Create socket client for the receiver
      const receiverClient = createSocketClient(receiver.user.token);
      
      try {
        await receiverClient.connected;
        
        // Set up notification listener
        const notificationPromise = new Promise((resolve) => {
          receiverClient.on('notification', (notification) => {
            if (notification.type === 'preference_test') {
              resolve(notification);
            }
          });
        });
        
        // Simulate a notification being created
        const testNotification = await Notification.create({
          userId: receiver.user.id,
          type: 'preference_test',
          title: 'Preference Test',
          message: 'This should respect notification preferences',
          data: { test: true },
          isRead: false
        });
        
        // Wait for the notification
        const receivedNotification = await notificationPromise;
        
        // Verify the notification doesn't have email flag set
        expect(receivedNotification).toMatchObject({
          id: testNotification.id.toString(),
          type: 'preference_test',
          // Should not include email notification flag
          shouldSendEmail: false
        });
        
      } finally {
        receiverClient.disconnect();
      }
    });
    
    it('should handle notification throttling', async () => {
      const [sender, receiver] = testUsers;
      
      // Create socket client for the receiver
      const receiverClient = createSocketClient(receiver.user.token);
      
      try {
        await receiverClient.connected;
        
        // Set up notification counter
        let notificationCount = 0;
        const notificationPromise = new Promise((resolve) => {
          receiverClient.on('notification', (notification) => {
            if (notification.type === 'throttle_test') {
              notificationCount++;
              
              // Resolve after receiving multiple notifications
              if (notificationCount >= 3) {
                resolve(notificationCount);
              }
            }
          });
        });
        
        // Simulate multiple rapid notifications
        for (let i = 0; i < 5; i++) {
          await Notification.create({
            userId: receiver.user.id,
            type: 'throttle_test',
            title: `Throttle Test ${i + 1}`,
            message: `Notification ${i + 1}`,
            isRead: false
          });
          
          // Small delay between notifications
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Wait for notifications to be processed
        const count = await notificationPromise;
        
        // Verify that we received a reasonable number of notifications
        // (throttling might prevent some from being delivered immediately)
        expect(count).toBeGreaterThanOrEqual(3);
        
      } finally {
        receiverClient.disconnect();
        
        // Clean up test notifications
        await Notification.destroy({
          where: {
            userId: receiver.user.id,
            type: 'throttle_test'
          }
        });
      }
    });
  });
  
  describe('Notification Badge Count', () => {
    it('should update unread notification count in real-time', async () => {
      const [sender, receiver] = testUsers;
      
      // Create a few unread notifications
      await Notification.bulkCreate([
        {
          userId: receiver.user.id,
          type: 'unread_count_1',
          title: 'Unread 1',
          message: 'First unread',
          isRead: false
        },
        {
          userId: receiver.user.id,
          type: 'unread_count_2',
          title: 'Unread 2',
          message: 'Second unread',
          isRead: false
        }
      ]);
      
      // Create socket client for the receiver
      const receiverClient = createSocketClient(receiver.user.token);
      
      try {
        await receiverClient.connected;
        
        // Set up badge count listener
        const badgePromise = new Promise((resolve) => {
          receiverClient.on('unread_count', (data) => {
            if (data.count !== undefined) {
              resolve(data.count);
            }
          });
        });
        
        // Request unread count
        receiverClient.emit('get_unread_count');
        
        // Wait for the count
        const count = await badgePromise;
        
        // Verify the count
        expect(count).toBeGreaterThanOrEqual(2);
        
      } finally {
        receiverClient.disconnect();
        
        // Clean up test notifications
        await Notification.destroy({
          where: {
            userId: receiver.user.id,
            type: { [Op.like]: 'unread_count_%' }
          }
        });
      }
    });
  });
});
