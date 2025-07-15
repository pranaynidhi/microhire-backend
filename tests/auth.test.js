const request = require('supertest');
const { app } = require('./setupTest');
const { User } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');

describe('Authentication Tests', () => {
  let testStudent;
  let testCompany;
  let studentToken;
  let companyToken;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    // Create test users
    testStudent = await User.create({
      fullName: 'Test Student',
      email: `student${timestamp}@test.com`,
      password: 'Test123!@#',
      role: 'student',
      isActive: true,
      emailVerified: true,
    });

    testCompany = await User.create({
      fullName: 'Test Company',
      email: `company${timestamp}@test.com`,
      password: 'Test123!@#',
      role: 'business',
      companyName: 'Test Company',
      isActive: true,
      emailVerified: true,
    });

    const { accessToken: studentAccessToken } = generateTokens(testStudent.id);
    const { accessToken: companyAccessToken } = generateTokens(testCompany.id);
    studentToken = studentAccessToken;
    companyToken = companyAccessToken;
  });

  afterEach(async () => {
    if (testStudent) await testStudent.destroy();
    if (testCompany) await testCompany.destroy();
  });

  describe('GET /api/auth/me', () => {
    it('should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('role');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/role', () => {
    it('should update user role', async () => {
      const response = await request(app)
        .post('/api/auth/role')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ role: 'student' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Role updated successfully');
    });

    it('should return 400 with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/role')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ role: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const timestamp = Date.now() + Math.floor(Math.random() * 10000);
      // First, set up a user with email verification token
      const user = await User.create({
        fullName: 'Test User',
        email: `test${timestamp}@example.com`,
        password: 'Test123!@#',
        role: 'student',
        emailVerificationToken: 'test-token',
        emailVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'test-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Clean up
      await user.destroy();
    });

    it('should return 400 with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(400);
    });
  });
});
