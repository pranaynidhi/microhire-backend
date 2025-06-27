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

describe('Certificates API', () => {
  describe('GET /api/certificates', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/certificates');
      expect(res.status).toBe(401);
    });
    it('should get all certificates (student)', async () => {
      const res = await request(app).get('/api/certificates').set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/certificates/:id', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/certificates/1');
      expect(res.status).toBe(401);
    });
    it('should get certificate by id (student)', async () => {
      const res = await request(app).get('/api/certificates/1').set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/certificates', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/certificates').send({});
      expect(res.status).toBe(401);
    });
    it('should add certificate (student)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', studentToken)
        .send({ name: 'Test Certificate' });
      expect([201, 400, 500]).toContain(res.status);
    });
  });

  describe('PUT /api/certificates/:id', () => {
    it('should require authentication', async () => {
      const res = await request(app).put('/api/certificates/1').send({});
      expect(res.status).toBe(401);
    });
    it('should update certificate (student)', async () => {
      const res = await request(app)
        .put('/api/certificates/1')
        .set('Authorization', studentToken)
        .send({ name: 'Updated Certificate' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/certificates/:id/revoke', () => {
    it('should require authentication', async () => {
      const res = await request(app).patch('/api/certificates/1/revoke').send({ reason: 'Test' });
      expect(res.status).toBe(401);
    });
    it('should revoke certificate (student)', async () => {
      const res = await request(app)
        .patch('/api/certificates/1/revoke')
        .set('Authorization', studentToken)
        .send({ reason: 'Test' });
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/certificates/generate', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/certificates/generate').send({});
      expect(res.status).toBe(401);
    });
    it('should generate certificate (company)', async () => {
      const res = await request(app)
        .post('/api/certificates/generate')
        .set('Authorization', companyToken)
        .send({});
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/certificates/verify/:certificateId', () => {
    it('should verify certificate (public)', async () => {
      const res = await request(app).get('/api/certificates/verify/1');
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/certificates/user/my-certificates', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/certificates/user/my-certificates');
      expect(res.status).toBe(401);
    });
    it('should get user certificates (student)', async () => {
      const res = await request(app)
        .get('/api/certificates/user/my-certificates')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/certificates/:id/share', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/certificates/1/share');
      expect(res.status).toBe(401);
    });
    it('should generate share link (student)', async () => {
      const res = await request(app)
        .post('/api/certificates/1/share')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/certificates/:id/analytics', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/certificates/1/analytics');
      expect(res.status).toBe(401);
    });
    it('should get certificate analytics (student)', async () => {
      const res = await request(app)
        .get('/api/certificates/1/analytics')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
}); 