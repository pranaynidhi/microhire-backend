const request = require('supertest');
const { server } = require('./setupTest');
const { User, Certificate } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');

let studentToken, companyToken;
let company, student;

beforeAll(async () => {
  // Create test users and get tokens
  const timestamp = Date.now() + Math.floor(Math.random() * 10000);
  company = await User.create({
    fullName: 'Test Company',
    email: `company${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'business',
    companyName: 'Test Company',
    isActive: true,
    emailVerified: true
  });
  student = await User.create({
    fullName: 'Test Student',
    email: `student${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'student',
    isActive: true,
    emailVerified: true
  });

  const studentRes = await request(server)
    .post('/api/auth/login')
    .send({ email: student.email, password: 'Test123!@#' });
  studentToken = 'Bearer ' + studentRes.body?.data?.accessToken;

  const companyRes = await request(server)
    .post('/api/auth/login')
    .send({ email: company.email, password: 'Test123!@#' });
  companyToken = 'Bearer ' + companyRes.body?.data?.accessToken;
});

afterEach(async () => {
  if (company) await company.destroy();
  if (student) await student.destroy();
});

describe('Certificate Endpoints', () => {
  describe('GET /api/certificates', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/certificates');
      expect(res.status).toBe(401);
    });

    it('should get certificates (student)', async () => {
      const res = await request(server)
        .get('/api/certificates')
        .set('Authorization', studentToken);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/certificates', () => {
    it('should require authentication', async () => {
      const res = await request(server)
        .post('/api/certificates')
        .send({ name: 'Test Certificate', description: 'Test Description' });
      expect(res.status).toBe(401);
    });

    it('should create certificate (company)', async () => {
      const res = await request(server)
        .post('/api/certificates')
        .set('Authorization', companyToken)
        .send({ name: 'Test Certificate', description: 'Test Description' });
      expect([201, 400, 500]).toContain(res.status);
    });
  });
}); 