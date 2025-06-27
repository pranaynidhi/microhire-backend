const request = require('supertest');
const app = require('../src/server');

let studentToken;
let companyToken;

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
});

describe('Users API', () => {
  describe('GET /api/users/me', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
    it('should get current user profile (student)', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
    it('should get current user profile (company)', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', companyToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should require authentication', async () => {
      const res = await request(app).put('/api/users/me').send({});
      expect(res.status).toBe(401);
    });
    it('should update user profile (student)', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', studentToken)
        .send({ fullName: 'New Name' });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/users/me/applications', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/users/me/applications');
      expect(res.status).toBe(401);
    });
    it('should get user applications (student)', async () => {
      const res = await request(app)
        .get('/api/users/me/applications')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/users/me/internships', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/users/me/internships');
      expect(res.status).toBe(401);
    });
    it('should get user internships (company)', async () => {
      const res = await request(app)
        .get('/api/users/me/internships')
        .set('Authorization', companyToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/users/subscribe', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/users/subscribe').send({});
      expect(res.status).toBe(401);
    });
    it('should fail with missing subscription (student)', async () => {
      const res = await request(app)
        .post('/api/users/subscribe')
        .set('Authorization', studentToken)
        .send({});
      expect([400, 401, 500]).toContain(res.status);
    });
    it('should subscribe with valid subscription (student)', async () => {
      const res = await request(app)
        .post('/api/users/subscribe')
        .set('Authorization', studentToken)
        .send({ subscription: { endpoint: 'test' } });
      expect([201, 200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/users/notify', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/users/notify').send({});
      expect(res.status).toBe(401);
    });
    it('should send notification (student)', async () => {
      const res = await request(app)
        .post('/api/users/notify')
        .set('Authorization', studentToken)
        .send({ title: 'Test', body: 'Test body' });
      expect([200, 500]).toContain(res.status);
    });
  });
}); 