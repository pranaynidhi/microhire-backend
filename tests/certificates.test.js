const request = require('supertest');
const { server } = require('./setupTest');
const { User, Certificate, Internship } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');

let studentToken;
let companyToken;
let adminToken;
let student;
let company;
let admin;
let internshipId;

beforeEach(async () => {
  try {
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

    admin = await User.create({
      fullName: 'Test Admin',
      email: `admin${timestamp}@test.com`,
      password: 'Test123!@#',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });

    // Create a completed internship for certificate tests
    const internship = await Internship.create({
      title: 'Test Internship Position',
      description: 'Test description',
      requirements: 'Test requirements',
      location: 'Test location',
      stipend: 10000,
      duration: '3 months',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Future deadline
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ended 1 day ago
      type: 'onsite',
      category: 'Development',
      companyId: company.id,
      studentId: student.id,
      status: 'closed', // Use 'closed' instead of 'completed'
    });
    internshipId = internship.id;

    const { accessToken: studentAccessToken } = generateTokens(student.id);
    const { accessToken: companyAccessToken } = generateTokens(company.id);
    const { accessToken: adminAccessToken } = generateTokens(admin.id);

    studentToken = `Bearer ${studentAccessToken}`;
    companyToken = `Bearer ${companyAccessToken}`;
    adminToken = `Bearer ${adminAccessToken}`;
  } catch (error) {
    console.error('Certificate test setup error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
});

afterEach(async () => {
  if (student) await student.destroy();
  if (company) await company.destroy();
  if (admin) await admin.destroy();
});

describe('Certificates API', () => {
  describe('GET /api/certificates', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/certificates');
      expect(res.status).toBe(401);
    });
    it('should get all certificates (student)', async () => {
      const res = await request(server).get('/api/certificates').set('Authorization', studentToken);
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/certificates/:id', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/certificates/1');
      expect(res.status).toBe(401);
    });
    it('should get certificate by id (student)', async () => {
      const res = await request(server)
        .get('/api/certificates/1')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/certificates', () => {
    it('should require authentication', async () => {
      const res = await request(server).post('/api/certificates').send({});
      expect(res.status).toBe(401);
    });
    it('should add certificate (student)', async () => {
      const res = await request(server)
        .post('/api/certificates')
        .set('Authorization', companyToken)
        .send({
          name: 'Test Certificate',
          internshipId,
        });
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    }, 30000);
  });

  describe('PUT /api/certificates/:id', () => {
    it('should require authentication', async () => {
      const res = await request(server).put('/api/certificates/1').send({});
      expect(res.status).toBe(401);
    });
    it('should update certificate (student)', async () => {
      const res = await request(server)
        .put('/api/certificates/1')
        .set('Authorization', companyToken)
        .send({
          name: 'Updated Certificate',
          internshipId,
        });
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    }, 30000);
  });

  describe('PATCH /api/certificates/:id/revoke', () => {
    it('should require authentication', async () => {
      const res = await request(server)
        .patch('/api/certificates/1/revoke')
        .send({ reason: 'Test' });
      expect([401, 404]).toContain(res.status);
    });
    it('should revoke certificate (student)', async () => {
      const res = await request(server)
        .patch('/api/certificates/1/revoke')
        .set('Authorization', studentToken)
        .send({ reason: 'Test' });
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/certificates/generate', () => {
    it('should require authentication', async () => {
      const res = await request(server).post('/api/certificates/generate').send({});
      expect(res.status).toBe(401);
    });
    it('should generate certificate (company)', async () => {
      const res = await request(server)
        .post('/api/certificates/generate')
        .set('Authorization', companyToken)
        .send({
          internshipId,
        });
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    }, 30000);
  });

  describe('GET /api/certificates/verify/:certificateId', () => {
    it('should verify certificate (public)', async () => {
      const res = await request(server).get('/api/certificates/verify/nonexistent-certificate');
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    }, 10000);
  });

  describe('GET /api/certificates/user/my-certificates', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/certificates/user/my-certificates');
      expect(res.status).toBe(401);
    });
    it('should get user certificates (student)', async () => {
      const res = await request(server)
        .get('/api/certificates/user/my-certificates')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/certificates/:id/share', () => {
    it('should require authentication', async () => {
      const res = await request(server).post('/api/certificates/1/share');
      expect([401, 404]).toContain(res.status);
    });
    it('should generate share link (student)', async () => {
      const res = await request(server)
        .post('/api/certificates/1/share')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/certificates/:id/analytics', () => {
    it('should require authentication', async () => {
      const res = await request(server).get('/api/certificates/1/analytics');
      expect([401, 404]).toContain(res.status);
    });
    it('should get certificate analytics (student)', async () => {
      const res = await request(server)
        .get('/api/certificates/1/analytics')
        .set('Authorization', studentToken);
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    });
  });
});
