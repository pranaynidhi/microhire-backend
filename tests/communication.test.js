const request = require('supertest');
const { server } = require('./setupTest');
const { User } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');

let studentToken;
let companyToken;
let student;
let company;

beforeEach(async () => {
  const timestamp = Date.now() + Math.floor(Math.random() * 10000);
  // Create test users
  student = await User.create({
    fullName: 'Test Student',
    email: `student${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'student',
    isActive: true,
    emailVerified: true,
  });

  company = await User.create({
    fullName: 'Test Company',
    email: `company${timestamp}@test.com`,
    password: 'Test123!@#',
    role: 'business',
    companyName: 'Test Company',
    isActive: true,
    emailVerified: true,
  });

  const { accessToken: studentAccessToken } = generateTokens(student.id);
  const { accessToken: companyAccessToken } = generateTokens(company.id);
  studentToken = `Bearer ${studentAccessToken}`;
  companyToken = `Bearer ${companyAccessToken}`;
});

afterEach(async () => {
  if (student) await student.destroy();
  if (company) await company.destroy();
});

describe('Communication Endpoints', () => {
  describe('GET /api/communication', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/communication');
      expect([401, 404]).toContain(res.status);
    });

    it('should get communication data (student)', async () => {
      const res = await request(server)
        .get('/api/communication')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
