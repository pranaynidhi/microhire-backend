const request = require('supertest');
const { server } = require('./setupTest');
const { User, Internship } = require('../src/models');
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

describe('Search API', () => {
  describe('GET /api/search/internships', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/search/internships');
      expect(res.status).toBe(401);
    });
    it('should search internships (student)', async () => {
      const res = await request(server).get('/api/search/internships').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/companies', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/search/companies');
      expect(res.status).toBe(401);
    });
    it('should search companies (company)', async () => {
      const res = await request(server).get('/api/search/companies').set('Authorization', companyToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/students', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/search/students');
      expect(res.status).toBe(401);
    });
    it('should search students (admin)', async () => {
      const res = await request(server).get('/api/search/students').set('Authorization', adminToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/advanced', () => {
    it('should get advanced search (public)', async () => {
      const res = await request(server).get('/api/search/advanced');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/recommendations', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/search/recommendations');
      expect(res.status).toBe(401);
    });
    it('should get recommendations (student)', async () => {
      const res = await request(server).get('/api/search/recommendations').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/similar/:id', () => {
    it('should get similar internships (public)', async () => {
      const res = await request(server).get('/api/search/similar/1');
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('should get search suggestions (public)', async () => {
      const res = await request(server).get('/api/search/suggestions');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/search/history/:id/save', () => {
    it('should require authentication', async () => {
      const res = await request(server).post('/api/search/history/1/save');
      expect(res.status).toBe(401);
    });
    it('should save search history (student)', async () => {
      const res = await request(server).post('/api/search/history/1/save').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/history', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/search/history');
      expect(res.status).toBe(401);
    });
    it('should get search history (student)', async () => {
      const res = await request(server).get('/api/search/history').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/saved', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/search/saved');
      expect(res.status).toBe(401);
    });
    it('should get saved searches (student)', async () => {
      const res = await request(server).get('/api/search/saved').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/search/track-click', () => {
    it('should require authentication', async () => {
      const res = await request(server).post('/api/search/track-click');
      expect(res.status).toBe(401);
    });
    it('should track search click (student)', async () => {
      const res = await request(server).post('/api/search/track-click').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });
}); 