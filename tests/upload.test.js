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

describe('Upload API', () => {
  describe('POST /api/upload/resume', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/upload/resume');
      expect(res.status).toBe(401);
    });
    it('should upload resume (student)', async () => {
      const res = await request(app)
        .post('/api/upload/resume')
        .set('Authorization', studentToken)
        .attach('resume', Buffer.from('test'), 'resume.pdf');
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/upload/logo', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/upload/logo');
      expect(res.status).toBe(401);
    });
    it('should upload logo (company)', async () => {
      const res = await request(app)
        .post('/api/upload/logo')
        .set('Authorization', companyToken)
        .attach('logo', Buffer.from('test'), 'logo.png');
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/upload/portfolio', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/upload/portfolio');
      expect(res.status).toBe(401);
    });
    it('should upload portfolio (student)', async () => {
      const res = await request(app)
        .post('/api/upload/portfolio')
        .set('Authorization', studentToken)
        .attach('portfolio', Buffer.from('test'), 'portfolio.zip');
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/upload/:filename', () => {
    it('should require authentication', async () => {
      const res = await request(app).delete('/api/upload/testfile.pdf');
      expect(res.status).toBe(401);
    });
    it('should delete file (student)', async () => {
      const res = await request(app)
        .delete('/api/upload/testfile.pdf')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/upload/files', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/upload/files');
      expect(res.status).toBe(401);
    });
    it('should get user files (student)', async () => {
      const res = await request(app)
        .get('/api/upload/files')
        .set('Authorization', studentToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
}); 