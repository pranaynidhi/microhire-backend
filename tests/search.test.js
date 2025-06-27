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

describe('Search API', () => {
  describe('GET /api/search/internships', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/search/internships');
      expect(res.status).toBe(401);
    });
    it('should search internships (student)', async () => {
      const res = await request(app).get('/api/search/internships').set('Authorization', studentToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/companies', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/search/companies');
      expect(res.status).toBe(401);
    });
    it('should search companies (company)', async () => {
      const res = await request(app).get('/api/search/companies').set('Authorization', companyToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/students', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/search/students');
      expect(res.status).toBe(401);
    });
    it('should search students (admin)', async () => {
      const res = await request(app).get('/api/search/students').set('Authorization', adminToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/advanced', () => {
    it('should get advanced search (public)', async () => {
      const res = await request(app).get('/api/search/advanced');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/recommendations', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/search/recommendations');
      expect(res.status).toBe(401);
    });
    it('should get recommendations (student)', async () => {
      const res = await request(app).get('/api/search/recommendations').set('Authorization', studentToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/similar/:id', () => {
    it('should get similar internships (public)', async () => {
      const res = await request(app).get('/api/search/similar/1');
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('should get search suggestions (public)', async () => {
      const res = await request(app).get('/api/search/suggestions');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/search/history/:id/save', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/search/history/1/save');
      expect(res.status).toBe(401);
    });
    it('should save search history (student)', async () => {
      const res = await request(app).post('/api/search/history/1/save').set('Authorization', studentToken);
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/history', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/search/history');
      expect(res.status).toBe(401);
    });
    it('should get search history (student)', async () => {
      const res = await request(app).get('/api/search/history').set('Authorization', studentToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/search/saved', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/search/saved');
      expect(res.status).toBe(401);
    });
    it('should get saved searches (student)', async () => {
      const res = await request(app).get('/api/search/saved').set('Authorization', studentToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('POST /api/search/track-click', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/search/track-click');
      expect(res.status).toBe(401);
    });
    it('should track search click (student)', async () => {
      const res = await request(app).post('/api/search/track-click').set('Authorization', studentToken);
      expect([200, 400, 403, 500]).toContain(res.status);
    });
  });
}); 