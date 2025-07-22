const { createTestUser, createSocketClient, cleanupTestUsers } = require('../../utils/socketTestUtils');
const { User } = require('../../../src/models');
const { Op } = require('sequelize');

// Increase timeout for all tests in this file
jest.setTimeout(30000);

describe('Socket.IO Authentication', () => {
  let testUsers = [];
  
  // Clean up test data
  afterAll(async () => {
    await cleanupTestUsers(testUsers);
  });

  describe('Connection and Authentication', () => {
    it('should connect with a valid token', async () => {
      // Create a test user and get a valid token
      const { user, token } = await createTestUser();
      testUsers.push(user);
      
      // Create and connect client
      const client = createSocketClient(token);
      
      try {
        // Wait for connection
        await client.connected;
        expect(client.connected).toBe(true);
        
        // Test a simple ping-pong
        const pong = await new Promise((resolve) => {
          client.emit('ping', (response) => {
            resolve(response);
          });
        });
        
        expect(pong).toBe('pong');
      } finally {
        client.disconnect();
      }
    });
    
    it('should reject connection with invalid token', async () => {
      const client = createSocketClient('invalid-token');
      
      try {
        // This should reject with an authentication error
        await expect(client.connected).rejects.toThrow();
        expect(client.connected).toBe(false);
      } finally {
        client.disconnect();
      }
    });
    
    it('should reject connection with expired token', async () => {
      // Create a token that expires immediately
      const { user, token } = await createTestUser();
      testUsers.push(user);
      
      // Create a token that expires immediately
      const expiredToken = require('jsonwebtoken').sign(
        { id: user.id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET
      );
      
      const client = createSocketClient(expiredToken);
      
      try {
        // This should reject with an authentication error
        await expect(client.connected).rejects.toThrow();
        expect(client.connected).toBe(false);
      } finally {
        client.disconnect();
      }
    });
    
    it('should disconnect inactive users after timeout', async () => {
      const { user, token } = await createTestUser();
      testUsers.push(user);
      
      const client = createSocketClient(token, {
        reconnection: false,
        // Disable built-in ping/pong to test our own timeout
        transports: ['websocket'],
        pingTimeout: 60000,
        pingInterval: 25000
      });
      
      try {
        await client.connected;
        expect(client.connected).toBe(true);
        
        // Wait for the server to detect the inactive connection
        // Our server has a 30s ping interval + 10s grace period = 40s total
        await new Promise(resolve => setTimeout(resolve, 45000));
        
        // The socket should be disconnected by now
        expect(client.connected).toBe(false);
      } finally {
        if (client.connected) {
          client.disconnect();
        }
      }
    });
  });
  
  describe('Rate Limiting', () => {
    it('should rate limit authentication attempts', async () => {
      // We'll test the rate limiting by making multiple failed connection attempts
      const failedClients = [];
      const maxAttempts = 5; // Should match the rate limiter config
      
      try {
        // Make multiple failed connection attempts
        for (let i = 0; i < maxAttempts + 2; i++) {
          const client = createSocketClient(`invalid-token-${i}`);
          failedClients.push(client);
          
          // Don't wait for connection to complete before starting the next one
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Wait a bit for the rate limiter to kick in
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // The first few attempts should fail with authentication errors
        // After the limit is reached, we should get rate limit errors
        const results = await Promise.allSettled(
          failedClients.map(client => client.connected)
        );
        
        // At least some should be rate limited
        const rateLimited = results.filter(
          r => r.status === 'rejected' && 
          r.reason && 
          r.reason.message && 
          r.reason.message.includes('rate')
        );
        
        expect(rateLimited.length).toBeGreaterThan(0);
      } finally {
        // Clean up
        failedClients.forEach(client => {
          if (client.connected) client.disconnect();
        });
      }
    });
  });
  
  describe('Session Management', () => {
    it('should allow multiple connections from the same user', async () => {
      const { user, token } = await createTestUser();
      testUsers.push(user);
      
      const client1 = createSocketClient(token);
      const client2 = createSocketClient(token);
      
      try {
        // Both clients should be able to connect
        await Promise.all([client1.connected, client2.connected]);
        
        expect(client1.connected).toBe(true);
        expect(client2.connected).toBe(true);
        
        // Test that both connections are active
        const pong1 = await new Promise((resolve) => {
          client1.emit('ping', resolve);
        });
        
        const pong2 = await new Promise((resolve) => {
          client2.emit('ping', resolve);
        });
        
        expect(pong1).toBe('pong');
        expect(pong2).toBe('pong');
      } finally {
        if (client1.connected) client1.disconnect();
        if (client2.connected) client2.disconnect();
      }
    });
    
    it('should enforce maximum concurrent sessions', async () => {
      const { user, token } = await createTestUser();
      testUsers.push(user);
      
      const maxSessions = 5; // Should match the server config
      const clients = [];
      
      try {
        // Create maxSessions + 1 connections
        for (let i = 0; i < maxSessions + 1; i++) {
          const client = createSocketClient(token);
          clients.push(client);
          await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
        }
        
        // Wait for all connections to be established or rejected
        const results = await Promise.allSettled(
          clients.map(client => client.connected)
        );
        
        // Count successful connections
        const successful = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');
        
        // Should have exactly maxSessions successful connections
        expect(successful.length).toBe(maxSessions);
        
        // The last one should be rejected due to session limit
        expect(failed.length).toBe(1);
        expect(failed[0].reason.message).toContain('too many active sessions');
        
      } finally {
        // Clean up
        clients.forEach(client => {
          if (client && client.connected) client.disconnect();
        });
      }
    });
    
    it('should terminate all sessions when user is deactivated', async () => {
      const { user, token } = await createTestUser();
      testUsers.push(user);
      
      const client1 = createSocketClient(token);
      const client2 = createSocketClient(token);
      
      try {
        await Promise.all([client1.connected, client2.connected]);
        
        // Deactivate the user
        await User.update(
          { isActive: false },
          { where: { id: user.id } }
        );
        
        // Wait for the deactivation to be detected
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Both clients should be disconnected
        expect(client1.connected).toBe(false);
        expect(client2.connected).toBe(false);
        
      } finally {
        if (client1.connected) client1.disconnect();
        if (client2.connected) client2.disconnect();
        
        // Reactivate the user for cleanup
        await User.update(
          { isActive: true },
          { where: { id: user.id } }
        );
      }
    });
  });
});
