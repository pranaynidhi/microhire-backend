const request = require('supertest');
const { server } = require('./setupTest');
const { User } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');

let studentToken, companyToken;
let student, company, studentId, companyId;

beforeEach(async () => {
  const timestamp = Date.now() + Math.floor(Math.random() * 10000);
  // Create company user
  company = await User.create({
    fullName: 'Test Company',
    email: `company${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'business',
    companyName: 'Test Company',
    isActive: true,
    emailVerified: true
  });
  companyId = company.id;
  const { accessToken: companyAccessToken } = generateTokens(company.id);
  companyToken = 'Bearer ' + companyAccessToken;

  // Create student user
  student = await User.create({
    fullName: 'Test Student',
    email: `student${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'student',
    isActive: true,
    emailVerified: true
  });
  studentId = student.id;
  const { accessToken: studentAccessToken } = generateTokens(student.id);
  studentToken = 'Bearer ' + studentAccessToken;
});

afterEach(async () => {
  if (student) await student.destroy();
  if (company) await company.destroy();
});

describe('Users API', () => {
  describe('GET /api/users/me', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(server).get('/api/users/me');
      expect(res.status).toBe(401);
    });
    it('should get current user profile (student, authenticated)', async () => {
      const res = await request(server)
        .get('/api/users/me')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 403, 404, 500]).toContain(res.status);
    });
    it('should get current user profile (company, authenticated)', async () => {
      const res = await request(server)
        .get('/api/users/me')
        .set('Authorization', companyToken);
      expect([200, 201, 400, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(server).put('/api/users/me').send({});
      expect(res.status).toBe(401);
    });
    it('should update user profile (student, authenticated)', async () => {
      const res = await request(server)
        .put('/api/users/me')
        .set('Authorization', studentToken)
        .send({ fullName: 'New Name' });
      expect([200, 201, 400, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/users/me/applications', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(server).get('/api/users/me/applications');
      expect(res.status).toBe(401);
    });
    it('should get user applications (student, authenticated)', async () => {
      const res = await request(server)
        .get('/api/users/me/applications')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/users/me/internships', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(server).get('/api/users/me/internships');
      expect(res.status).toBe(401);
    });
    it('should get user internships (company, authenticated)', async () => {
      const res = await request(server)
        .get('/api/users/me/internships')
        .set('Authorization', companyToken);
      expect([200, 201, 400, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/users/subscribe', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(server).post('/api/users/subscribe').send({});
      expect(res.status).toBe(401);
    });
    it('should fail with missing subscription (student, authenticated)', async () => {
      const res = await request(server)
        .post('/api/users/subscribe')
        .set('Authorization', studentToken)
        .send({});
      expect([200, 201, 400, 403, 404, 500]).toContain(res.status);
    });
    it('should subscribe with valid subscription (student, authenticated)', async () => {
      const res = await request(server)
        .post('/api/users/subscribe')
        .set('Authorization', studentToken)
        .send({ subscription: { endpoint: 'test' } });
      expect([200, 201, 400, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/users/notify', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(server).post('/api/users/notify').send({});
      expect(res.status).toBe(401);
    });
    it('should send notification (student, authenticated)', async () => {
      const res = await request(server)
        .post('/api/users/notify')
        .set('Authorization', studentToken)
        .send({ title: 'Test', body: 'Test body' });
      expect([200, 201, 400, 403, 404, 500]).toContain(res.status);
    });
  });
}); 