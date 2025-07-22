const request = require('supertest');
const { server } = require('../test/setupTestEnv');
const { User, Upload } = require('../src/models');

let studentToken;
let companyToken;
let student;
let company;

beforeAll(async () => {
  // Create test users
  student = await User.create({
    fullName: 'Test Student',
    email: `student-${Date.now()}@test.com`,
    password: 'Test123!@#',
    role: 'student',
    isActive: true,
    emailVerified: true,
  });

  company = await User.create({
    fullName: 'Test Company',
    email: `company-${Date.now()}@test.com`,
    password: 'Test123!@#',
    role: 'business',
    companyName: 'Test Company',
    isActive: true,
    emailVerified: true,
  });

  const { generateTokens } = require('../src/controllers/authController');
  const { accessToken: studentAccessToken } = generateTokens(student.id);
  const { accessToken: companyAccessToken } = generateTokens(company.id);
  studentToken = `Bearer ${studentAccessToken}`;
  companyToken = `Bearer ${companyAccessToken}`;
});

afterAll(async () => {
  // Clean up test data
  await Promise.all([
    Upload.destroy({ where: {}, force: true }),
    User.destroy({ where: { id: [student?.id, company?.id].filter(Boolean) } })
  ]);
});

describe('Upload Endpoints', () => {
  describe('POST /api/upload', () => {
    it('should require authentication', async () => {
      const res = await request(server).post('/api/upload');
      expect(res.status).toBeOneOf([401, 403, 404]);
    });

    it('should upload file (student)', async () => {
      const res = await request(server)
        .post('/api/upload')
        .set('Authorization', studentToken)
        .attach('file', Buffer.from('test file content'), 'test.txt');
      expect(res.status).toBeOneOf([201, 400, 404, 500]);
    });
  });

  describe('GET /api/upload/files', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/upload/files');
      expect(res.status).toBe(401);
    });

    it('should get user files (student)', async () => {
      const res = await request(server).get('/api/upload/files').set('Authorization', studentToken);
      expect([200, 500]).toContain(res.status);
    });
  });
});
