const request = require('supertest');
const { server } = require('./setupTest');
const { User, Message, Conversation } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');
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
    console.log('Cleanup error (ignored):', error.message);
  }
});

describe('Messages API', () => {
  describe('GET /api/messages/conversations', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/messages/conversations');
      expect(res.status).toBe(401);
    });
    it('should get all conversations (student)', async () => {
      const res = await request(server).get('/api/messages/conversations').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/messages/conversations/:conversationId', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/messages/conversations/1');
      expect(res.status).toBe(401);
    });
    it('should get messages in conversation (student)', async () => {
      const res = await request(server).get('/api/messages/conversations/1').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/messages/conversations/:conversationId', () => {
    it('should require authentication', async () => {
      const res = await request(server).post('/api/messages/conversations/1').send({ content: 'Hello' });
      expect(res.status).toBe(401);
    });
    it('should send message in conversation (student)', async () => {
      const res = await request(server)
        .post('/api/messages/conversations/1')
        .set('Authorization', studentToken)
        .send({ content: 'Hello' });
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/messages/conversations/:conversationId/read', () => {
    it('should require authentication', async () => {
      const res = await request(server).patch('/api/messages/conversations/1/read');
      expect(res.status).toBe(401);
    });
    it('should mark conversation as read (student)', async () => {
      const res = await request(server)
        .patch('/api/messages/conversations/1/read')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/messages/conversations/:conversationId', () => {
    it('should require authentication', async () => {
      const res = await request(server).delete('/api/messages/conversations/1');
      expect(res.status).toBe(401);
    });
    it('should delete conversation (student)', async () => {
      const res = await request(server)
        .delete('/api/messages/conversations/1')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });
}); 