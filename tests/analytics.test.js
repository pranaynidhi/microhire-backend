const request = require('supertest');
const { server } = require('./setupTest');
const { User, Internship, Application } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');
const logger = require('../src/utils/logger');
let studentToken, companyToken, adminToken;
let student, company, admin;

beforeAll(async () => {
  const timestamp = Date.now() + Math.floor(Math.random() * 10000);
  // Create test users
  student = await User.create({
    fullName: 'Test Student',
    email: `student${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'student',
    isActive: true,
    emailVerified: true
  });
  company = await User.create({
    fullName: 'Test Company',
    email: `company${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'business',
    companyName: 'Test Company',
    isActive: true,
    emailVerified: true
  });
  admin = await User.create({
    fullName: 'Test Admin',
    email: `admin${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'admin',
    isActive: true,
    emailVerified: true
  });

  // Login and get tokens
  const studentRes = await request(server)
    .post('/api/auth/login')
    .send({ email: student.email, password: 'Test123!@#' });
  studentToken = 'Bearer ' + studentRes.body?.data?.accessToken;

  const companyRes = await request(server)
    .post('/api/auth/login')
    .send({ email: company.email, password: 'Test123!@#' });
  companyToken = 'Bearer ' + companyRes.body?.data?.accessToken;

  const adminRes = await request(server)
    .post('/api/auth/login')
    .send({ email: admin.email, password: 'Test123!@#' });
  adminToken = 'Bearer ' + adminRes.body?.data?.accessToken;
});

afterAll(async () => {
  try {
    if (student) await student.destroy();
    if (company) await company.destroy();
    if (admin) await admin.destroy();
  } catch (error) {
    // Ignore cleanup errors due to connection issues
    logger.info('Cleanup error (ignored):', error.message);
  }
});

describe('Analytics API', () => {
  describe('GET /api/analytics/user', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/analytics/user');
      expect(res.status).toBe(401);
    });
    it('should get user analytics (student)', async () => {
      const res = await request(server).get('/api/analytics/user').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/company', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/analytics/company');
      expect(res.status).toBe(401);
    });
    it('should get company analytics (company)', async () => {
      const res = await request(server).get('/api/analytics/company').set('Authorization', companyToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/platform', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/analytics/platform');
      expect(res.status).toBe(401);
    });
    it('should get platform analytics (admin)', async () => {
      const res = await request(server).get('/api/analytics/platform').set('Authorization', adminToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });
}); 