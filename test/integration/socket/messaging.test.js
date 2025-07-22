const { createTestUser, createSocketClient, cleanupTestUsers } = require('../../utils/socketTestUtils');
const { Message, Conversation, User } = require('../../../src/models');
const { Op } = require('sequelize');

// Increase timeout for all tests in this file
jest.setTimeout(30000);

describe('Socket.IO Messaging', () => {
  let testUsers = [];
  let testConversation;
  
  // Create test data before all tests
  beforeAll(async () => {
    // Create two test users
    const [user1, user2] = await Promise.all([
      createTestUser({ role: 'student' }),
      createTestUser({ role: 'employer' })
    ]);
    
    testUsers.push(user1.user, user2.user);
    
    // Create a conversation between them
    testConversation = await Conversation.create({
      title: 'Test Conversation',
      createdBy: user1.user.id
    });
    
    // Add users to conversation
    await testConversation.addUsers([user1.user.id, user2.user.id]);
  });
  
  // Clean up test data
  afterAll(async () => {
    // Clean up conversations and messages
    await Message.destroy({ where: {}, force: true });
    await Conversation.destroy({ where: {}, force: true });
    await cleanupTestUsers(testUsers);
  });
  
  describe('Direct Messaging', () => {
    it('should allow users to send and receive direct messages', async () => {
      const [sender, receiver] = testUsers;
      
      // Create socket clients for both users
      const senderClient = createSocketClient(sender.token);
      const receiverClient = createSocketClient(receiver.token);
      
      try {
        // Wait for both clients to connect
        await Promise.all([
          senderClient.connected,
          receiverClient.connected
        ]);
        
        // Join the conversation room
        senderClient.emit('join_conversation', { conversationId: testConversation.id });
        receiverClient.emit('join_conversation', { conversationId: testConversation.id });
        
        // Wait a bit for the join to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set up message listener on receiver's client
        const messagePromise = new Promise((resolve) => {
          receiverClient.on('new_message', (message) => {
            resolve(message);
          });
        });
        
        // Send a message from sender to receiver
        const testMessage = {
          conversationId: testConversation.id,
          content: 'Hello, this is a test message!',
          senderId: sender.user.id
        };
        
        senderClient.emit('send_message', testMessage);
        
        // Wait for the message to be received
        const receivedMessage = await messagePromise;
        
        // Verify the message content
        expect(receivedMessage).toMatchObject({
          conversationId: testConversation.id,
          content: testMessage.content,
          senderId: sender.user.id.toString(),
          status: 'delivered'
        });
        
        // Verify the message was saved to the database
        const dbMessage = await Message.findOne({
          where: { id: receivedMessage.id }
        });
        
        expect(dbMessage).not.toBeNull();
        expect(dbMessage.content).toBe(testMessage.content);
        
      } finally {
        senderClient.disconnect();
        receiverClient.disconnect();
      }
    });
    
    it('should notify users when they receive a new message', async () => {
      const [sender, receiver] = testUsers;
      
      // Create socket clients for both users
      const senderClient = createSocketClient(sender.token);
      const receiverClient = createSocketClient(receiver.token);
      
      try {
        await Promise.all([
          senderClient.connected,
          receiverClient.connected
        ]);
        
        // Join the conversation room
        senderClient.emit('join_conversation', { conversationId: testConversation.id });
        receiverClient.emit('join_conversation', { conversationId: testConversation.id });
        
        // Wait a bit for the join to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set up notification listener on receiver's client
        const notificationPromise = new Promise((resolve) => {
          receiverClient.on('notification', (notification) => {
            if (notification.type === 'new_message') {
              resolve(notification);
            }
          });
        });
        
        // Send a message from sender to receiver
        const testMessage = {
          conversationId: testConversation.id,
          content: 'You have a new notification!',
          senderId: sender.user.id
        };
        
        senderClient.emit('send_message', testMessage);
        
        // Wait for the notification
        const notification = await notificationPromise;
        
        // Verify the notification
        expect(notification).toMatchObject({
          type: 'new_message',
          userId: receiver.user.id,
          data: expect.objectContaining({
            conversationId: testConversation.id,
            senderId: sender.user.id.toString()
          })
        });
        
      } finally {
        senderClient.disconnect();
        receiverClient.disconnect();
      }
    });
    
    it('should update message status when read', async () => {
      const [sender, receiver] = testUsers;
      
      // Create socket clients for both users
      const senderClient = createSocketClient(sender.token);
      const receiverClient = createSocketClient(receiver.token);
      
      try {
        await Promise.all([
          senderClient.connected,
          receiverClient.connected
        ]);
        
        // Join the conversation room
        senderClient.emit('join_conversation', { conversationId: testConversation.id });
        receiverClient.emit('join_conversation', { conversationId: testConversation.id });
        
        // Wait a bit for the join to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Send a message from sender to receiver
        const testMessage = {
          conversationId: testConversation.id,
          content: 'Please confirm you read this',
          senderId: sender.user.id
        };
        
        // Get the message ID when it's sent
        const messageSentPromise = new Promise((resolve) => {
          senderClient.once('message_sent', (message) => {
            resolve(message);
          });
        });
        
        senderClient.emit('send_message', testMessage);
        const sentMessage = await messageSentPromise;
        
        // Set up status update listener on sender's client
        const statusUpdatePromise = new Promise((resolve) => {
          senderClient.on('message_status', (update) => {
            if (update.messageId === sentMessage.id && update.status === 'read') {
              resolve(update);
            }
          });
        });
        
        // Receiver marks the message as read
        receiverClient.emit('mark_as_read', {
          messageId: sentMessage.id,
          conversationId: testConversation.id
        });
        
        // Wait for the status update
        const statusUpdate = await statusUpdatePromise;
        
        // Verify the status update
        expect(statusUpdate).toMatchObject({
          messageId: sentMessage.id,
          status: 'read',
          updatedAt: expect.any(String)
        });
        
        // Verify the message was updated in the database
        const updatedMessage = await Message.findByPk(sentMessage.id);
        expect(updatedMessage.status).toBe('read');
        
      } finally {
        senderClient.disconnect();
        receiverClient.disconnect();
      }
    });
  });
  
  describe('Typing Indicators', () => {
    it('should broadcast typing status to other conversation participants', async () => {
      const [user1, user2] = testUsers;
      
      // Create socket clients for both users
      const client1 = createSocketClient(user1.token);
      const client2 = createSocketClient(user2.token);
      
      try {
        await Promise.all([client1.connected, client2.connected]);
        
        // Join the conversation room
        client1.emit('join_conversation', { conversationId: testConversation.id });
        client2.emit('join_conversation', { conversationId: testConversation.id });
        
        // Wait a bit for the join to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set up typing indicator listener on client2
        const typingPromise = new Promise((resolve) => {
          client2.on('user_typing', (data) => {
            if (data.userId === user1.user.id) {
              resolve(data);
            }
          });
        });
        
        // Client1 starts typing
        client1.emit('typing', {
          conversationId: testConversation.id,
          isTyping: true
        });
        
        // Wait for the typing indicator
        const typingData = await typingPromise;
        
        // Verify the typing indicator
        expect(typingData).toMatchObject({
          userId: user1.user.id.toString(),
          conversationId: testConversation.id,
          isTyping: true
        });
        
      } finally {
        client1.disconnect();
        client2.disconnect();
      }
    });
  });
  
  describe('Presence', () => {
    it('should track online/offline status of users', async () => {
      const [user1, user2] = testUsers;
      
      // Create socket clients for both users
      const client1 = createSocketClient(user1.token);
      const client2 = createSocketClient(user2.token);
      
      try {
        await Promise.all([client1.connected, client2.connected]);
        
        // Set up presence listener on client2
        const presencePromise = new Promise((resolve) => {
          client2.on('presence_update', (update) => {
            if (update.userId === user1.user.id) {
              resolve(update);
            }
          });
        });
        
        // Client1 disconnects
        client1.disconnect();
        
        // Wait for the presence update
        const presenceUpdate = await presencePromise;
        
        // Verify the presence update
        expect(presenceUpdate).toMatchObject({
          userId: user1.user.id.toString(),
          isOnline: false,
          lastSeen: expect.any(String)
        });
        
      } finally {
        if (client1.connected) client1.disconnect();
        if (client2.connected) client2.disconnect();
      }
    });
  });
});
