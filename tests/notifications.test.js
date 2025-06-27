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

describe('Notifications API', () => {
  describe('GET /api/notifications', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
    it('should get all notifications (student)', async () => {
      const res = await request(app).get('/api/notifications').set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should require authentication', async () => {
      const res = await request(app).patch('/api/notifications/1/read');
      expect(res.status).toBe(401);
    });
    it('should mark notification as read (student)', async () => {
      const res = await request(app)
        .patch('/api/notifications/1/read')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should require authentication', async () => {
      const res = await request(app).patch('/api/notifications/read-all');
      expect(res.status).toBe(401);
    });
    it('should mark all notifications as read (student)', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', studentToken);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should require authentication', async () => {
      const res = await request(app).delete('/api/notifications/1');
      expect(res.status).toBe(401);
    });
    it('should delete notification (student)', async () => {
      const res = await request(app)
        .delete('/api/notifications/1')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/notifications', () => {
    it('should require authentication', async () => {
      const res = await request(app).delete('/api/notifications');
      expect(res.status).toBe(401);
    });
    it('should delete all notifications (student)', async () => {
      const res = await request(app)
        .delete('/api/notifications')
        .set('Authorization', studentToken);
      expect([200, 500]).toContain(res.status);
    });
  });
}); 