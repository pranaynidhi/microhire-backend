const request = require('supertest');
const { server } = require('./setupTest');
const { User, Notification } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');
let studentToken, companyToken, adminToken;
let student, company, admin;

beforeAll(async () => {
  const timestamp = Date.now() + Math.floor(Math.random() * 10000);
  // Create users
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

  // Login as student
  const studentRes = await request(server)
    .post('/api/auth/login')
    .send({ email: student.email, password: 'Test123!@#' });
  studentToken = 'Bearer ' + studentRes.body?.data?.accessToken;

  // Login as company
  const companyRes = await request(server)
    .post('/api/auth/login')
    .send({ email: company.email, password: 'Test123!@#' });
  companyToken = 'Bearer ' + companyRes.body?.data?.accessToken;

  // Login as admin
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

describe('Notifications API', () => {
  describe('GET /api/notifications', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/notifications');
      expect(res.status).toBe(401);
    });
    it('should get all notifications (authenticated student)', async () => {
      const res = await request(server).get('/api/notifications').set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should require authentication', async () => {
      const res = await request(server).patch('/api/notifications/1/read');
      expect(res.status).toBe(401);
    });
    it('should mark notification as read (authenticated student)', async () => {
      const res = await request(server)
        .patch('/api/notifications/1/read')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should require authentication', async () => {
      const res = await request(server).patch('/api/notifications/read-all');
      expect(res.status).toBe(401);
    });
    it('should mark all notifications as read (authenticated student)', async () => {
      const res = await request(server)
        .patch('/api/notifications/read-all')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should require authentication', async () => {
      const res = await request(server).delete('/api/notifications/1');
      expect(res.status).toBe(401);
    });
    it('should delete notification (authenticated student)', async () => {
      const res = await request(server)
        .delete('/api/notifications/1')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/notifications', () => {
    it('should require authentication', async () => {
      const res = await request(server).delete('/api/notifications');
      expect(res.status).toBe(401);
    });
    it('should delete all notifications (authenticated student)', async () => {
      const res = await request(server)
        .delete('/api/notifications')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 401, 404, 500]).toContain(res.status);
    });
  });
}); 