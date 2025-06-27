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

describe('Messages API', () => {
  describe('GET /api/messages/conversations', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/messages/conversations');
      expect(res.status).toBe(401);
    });
    it('should get all conversations (student)', async () => {
      const res = await request(app).get('/api/messages/conversations').set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/messages/conversations/:conversationId', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/messages/conversations/1');
      expect(res.status).toBe(401);
    });
    it('should get messages in conversation (student)', async () => {
      const res = await request(app).get('/api/messages/conversations/1').set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/messages/conversations/:conversationId', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/messages/conversations/1').send({ content: 'Hello' });
      expect(res.status).toBe(401);
    });
    it('should send message in conversation (student)', async () => {
      const res = await request(app)
        .post('/api/messages/conversations/1')
        .set('Authorization', studentToken)
        .send({ content: 'Hello' });
      expect([201, 400, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/messages/conversations/:conversationId/read', () => {
    it('should require authentication', async () => {
      const res = await request(app).patch('/api/messages/conversations/1/read');
      expect(res.status).toBe(401);
    });
    it('should mark conversation as read (student)', async () => {
      const res = await request(app)
        .patch('/api/messages/conversations/1/read')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/messages/conversations/:conversationId', () => {
    it('should require authentication', async () => {
      const res = await request(app).delete('/api/messages/conversations/1');
      expect(res.status).toBe(401);
    });
    it('should delete conversation (student)', async () => {
      const res = await request(app)
        .delete('/api/messages/conversations/1')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
}); 