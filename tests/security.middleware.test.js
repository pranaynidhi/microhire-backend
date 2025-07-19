const request = require('supertest');
const express = require('express');
const { createServer } = require('http');
const { applySecurityMiddleware } = require('../src/middleware/security');
const { sanitizeRequestBody, commonSanitizationRules, validate } = require('../src/middleware/sanitization');
const logger = require('../src/utils/logger');

// Mock logger to avoid cluttering test output
jest.mock('../src/utils/logger');

describe('Security Middleware', () => {
  let app;
  let server;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Test route
    app.get('/test', (req, res) => {
      res.status(200).json({ success: true });
    });
    
    // Test route with validation
    app.post(
      '/test/validation',
      [
        commonSanitizationRules.stringField('name'),
        commonSanitizationRules.emailField('email'),
        validate
      ],
      (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      }
    );
    
    // Apply security middleware
    applySecurityMiddleware(app);
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        ...(err.details && { details: err.details })
      });
    });
    
    server = createServer(app);
  });
  
  afterEach(() => {
    server.close();
    jest.clearAllMocks();
  });

  describe('Security Headers', () => {
    it('should set security headers on responses', async () => {
      const response = await request(server).get('/test');
      
      expect(response.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'permissions-policy': 'geolocation=(), microphone=(), camera=()',
      });
      
      // CSP should be set by helmet
      expect(response.headers).toHaveProperty('content-security-policy');
      expect(response.headers).toHaveProperty('cross-origin-embedder-policy');
      expect(response.headers).toHaveProperty('cross-origin-opener-policy');
    });
  });

  describe('Request Sanitization', () => {
    it('should sanitize request body to prevent NoSQL injection', async () => {
      const maliciousPayload = {
        $where: 'malicious code',
        $ne: null,
        role: { $ne: null },
        normalField: 'safe value'
      };
      
      const sanitized = {};
      const req = { body: { ...maliciousPayload } };
      const res = {};
      const next = jest.fn();
      
      sanitizeRequestBody(req, res, next);
      
      expect(req.body).toEqual({
        normalField: 'safe value'
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should validate and sanitize input fields', async () => {
      const testData = {
        name: '  Test User  ', // Should be trimmed
        email: '  TEST@EXAMPLE.COM  ' // Should be normalized
      };
      
      const response = await request(server)
        .post('/test/validation')
        .send(testData);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          name: 'Test User',  // Trimmed
          email: 'test@example.com'  // Lowercased
        }
      });
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(server)
        .post('/test/validation')
        .send({
          name: 'Test User',
          email: 'invalid-email'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'must be a valid email'
          })
        ])
      });
    });
  });

  describe('XSS Protection', () => {
    it('should set XSS protection headers', async () => {
      const response = await request(server).get('/test');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from allowed origins', async () => {
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
      const response = await request(server)
        .get('/test')
        .set('Origin', allowedOrigin);
      
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should block requests from disallowed origins', async () => {
      const response = await request(server)
        .get('/test')
        .set('Origin', 'http://malicious-site.com');
      
      // CORS middleware will respond with 200 but without CORS headers
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
