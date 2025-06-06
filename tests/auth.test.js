const request = require('supertest');
const app = require('../src/app');
const { getFirebaseAdmin } = require('../src/config/firebase');
const { AppError } = require('../src/utils/errors');

describe('Authentication Tests', () => {
  let testStudent;
  let testCompany;
  let studentToken;
  let companyToken;

  beforeAll(async () => {
    // Create test users in Firebase
    const admin = getFirebaseAdmin();
    
    // Create test student
    testStudent = await admin.auth().createUser({
      email: 'student@test.com',
      password: 'Test123!@#',
      displayName: 'Test Student',
      emailVerified: true
    });

    // Create test company
    testCompany = await admin.auth().createUser({
      email: 'company@test.com',
      password: 'Test123!@#',
      displayName: 'Test Company',
      emailVerified: true
    });

    // Set custom claims for roles
    await admin.auth().setCustomUserClaims(testStudent.uid, { role: 'student' });
    await admin.auth().setCustomUserClaims(testCompany.uid, { role: 'company' });

    // Get custom tokens for testing
    studentToken = await admin.auth().createCustomToken(testStudent.uid);
    companyToken = await admin.auth().createCustomToken(testCompany.uid);
  });

  afterAll(async () => {
    // Clean up test users
    const admin = getFirebaseAdmin();
    await admin.auth().deleteUser(testStudent.uid);
    await admin.auth().deleteUser(testCompany.uid);
  });

  describe('GET /api/auth/me', () => {
    it('should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('uid');
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
    it('should return custom token for email verification', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customToken');
    });

    it('should return 400 if email already verified', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already verified');
    });
  });
});
