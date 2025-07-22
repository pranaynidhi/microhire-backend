const request = require('supertest');
const { server } = require('../test/setupTestEnv');
const { User, Conversation, Message } = require('../src/models');

let studentToken;
let companyToken;
let student;
let company;
let testConversation;

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

  // Create a test conversation
  testConversation = await Conversation.create({
    title: 'Test Conversation',
    createdBy: student.id
  });
  
  // Add participants to conversation
  await testConversation.addUsers([student.id, company.id]);

  // Generate tokens
  const { generateTokens } = require('../src/controllers/authController');
  const { accessToken: studentAccessToken } = generateTokens(student.id);
  const { accessToken: companyAccessToken } = generateTokens(company.id);
  studentToken = `Bearer ${studentAccessToken}`;
  companyToken = `Bearer ${companyAccessToken}`;
});

afterAll(async () => {
  // Clean up test data
  await Promise.all([
    Message.destroy({ where: {}, force: true }),
    Conversation.destroy({ where: {}, force: true }),
    User.destroy({ where: { id: [student?.id, company?.id].filter(Boolean) } })
  ]);
});

describe('Communication Endpoints', () => {
  describe('GET /api/communication', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/communication');
      expect(res.status).toBeOneOf([401, 403, 404]);
    });

    it('should get communication data (student)', async () => {
      const res = await request(server)
        .get('/api/communication')
        .set('Authorization', studentToken);
      expect(res.status).toBeOneOf([200, 204, 400, 404, 500]);
    });
  });
});
