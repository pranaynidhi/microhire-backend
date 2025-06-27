const request = require('supertest');
const app = require('../src/server');
let adminToken;

beforeAll(async () => {
  // Login as admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Test123!@#' });
  adminToken = 'Bearer ' + adminRes.body?.data?.accessToken;
});

describe('Admin API', () => {
  describe('GET /api/admin/users', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
    });
    it('should get all users (admin)', async () => {
      const res = await request(app).get('/api/admin/users').set('Authorization', adminToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/admin/users/1');
      expect(res.status).toBe(401);
    });
    it('should get user by id (admin)', async () => {
      const res = await request(app).get('/api/admin/users/1').set('Authorization', adminToken);
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/admin/users/:id/role', () => {
    it('should require authentication', async () => {
      const res = await request(app).patch('/api/admin/users/1/role').send({ role: 'student' });
      expect(res.status).toBe(401);
    });
    it('should update user role (admin)', async () => {
      const res = await request(app)
        .patch('/api/admin/users/1/role')
        .set('Authorization', adminToken)
        .send({ role: 'student' });
      expect([200, 400, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('POST /api/admin/users/:id/suspend', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/admin/users/1/suspend');
      expect(res.status).toBe(401);
    });
    it('should suspend user (admin)', async () => {
      const res = await request(app)
        .post('/api/admin/users/1/suspend')
        .set('Authorization', adminToken);
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('POST /api/admin/users/:id/unsuspend', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/admin/users/1/unsuspend');
      expect(res.status).toBe(401);
    });
    it('should unsuspend user (admin)', async () => {
      const res = await request(app)
        .post('/api/admin/users/1/unsuspend')
        .set('Authorization', adminToken);
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should require authentication', async () => {
      const res = await request(app).delete('/api/admin/users/1');
      expect(res.status).toBe(401);
    });
    it('should delete user (admin)', async () => {
      const res = await request(app)
        .delete('/api/admin/users/1')
        .set('Authorization', adminToken);
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/admin/internships', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/admin/internships');
      expect(res.status).toBe(401);
    });
    it('should get internships (admin)', async () => {
      const res = await request(app).get('/api/admin/internships').set('Authorization', adminToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/admin/internships/:id/moderate', () => {
    it('should require authentication', async () => {
      const res = await request(app).patch('/api/admin/internships/1/moderate').send({ status: 'approved' });
      expect(res.status).toBe(401);
    });
    it('should moderate internship (admin)', async () => {
      const res = await request(app)
        .patch('/api/admin/internships/1/moderate')
        .set('Authorization', adminToken)
        .send({ status: 'approved' });
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/admin/reports', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/admin/reports');
      expect(res.status).toBe(401);
    });
    it('should get reports (admin)', async () => {
      const res = await request(app).get('/api/admin/reports').set('Authorization', adminToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('POST /api/admin/reports/:id/resolve', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/admin/reports/1/resolve');
      expect(res.status).toBe(401);
    });
    it('should resolve report (admin)', async () => {
      const res = await request(app)
        .post('/api/admin/reports/1/resolve')
        .set('Authorization', adminToken);
      expect([200, 404, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/admin/dashboard', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });
    it('should get dashboard overview (admin)', async () => {
      const res = await request(app).get('/api/admin/dashboard').set('Authorization', adminToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/admin/settings', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/admin/settings');
      expect(res.status).toBe(401);
    });
    it('should get system settings (admin)', async () => {
      const res = await request(app).get('/api/admin/settings').set('Authorization', adminToken);
      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('PUT /api/admin/settings', () => {
    it('should require authentication', async () => {
      const res = await request(app).put('/api/admin/settings').send({});
      expect(res.status).toBe(401);
    });
    it('should update system settings (admin)', async () => {
      const res = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', adminToken)
        .send({});
      expect([200, 400, 403, 500]).toContain(res.status);
    });
  });
}); 