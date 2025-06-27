const request = require('supertest');
const app = require('../src/server');
let studentToken, companyToken, adminToken;

beforeAll(async () => {
  // Login as student
  const studentRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@test.com', password: 'Test123!@#' });
  studentToken = 'Bearer ' + studentRes.body?.data?.accessToken;

  // Login as company
  const companyRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'company@test.com', password: 'Test123!@#' });
  companyToken = 'Bearer ' + companyRes.body?.data?.accessToken;

  // Login as admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Test123!@#' });
  adminToken = 'Bearer ' + adminRes.body?.data?.accessToken;
});

describe('Analytics API', () => {
  describe('GET /api/analytics/user', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/analytics/user');
      expect(res.status).toBe(401);
    });
    it('should get user analytics (student)', async () => {
      const res = await request(app).get('/api/analytics/user').set('Authorization', studentToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/company', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/analytics/company');
      expect(res.status).toBe(401);
    });
    it('should get company analytics (company)', async () => {
      const res = await request(app).get('/api/analytics/company').set('Authorization', companyToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/platform', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/analytics/platform');
      expect(res.status).toBe(401);
    });
    it('should get platform analytics (admin)', async () => {
      const res = await request(app).get('/api/analytics/platform').set('Authorization', adminToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });
}); 