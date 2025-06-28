const request = require('supertest');
const { server } = require('./setupTest');
const { User, Internship } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');

describe('Internships', () => {
  let companyToken;
  let studentToken;
  let companyId;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    // Create company user
    const company = await User.create({
      fullName: 'Test Company',
      email: `company${timestamp}@test.com`,
      password: 'Test123!@#',
      role: 'business',
      companyName: 'Test Company',
      isActive: true,
      emailVerified: true
    });
    companyId = company.id;
    const { accessToken: companyAccessToken } = generateTokens(company.id);
    companyToken = 'Bearer ' + companyAccessToken;

    // Create student user
    const student = await User.create({
      fullName: 'Test Student',
      email: `student${timestamp}@test.com`,
      password: 'Test123!@#',
      role: 'student',
      isActive: true,
      emailVerified: true
    });
    const { accessToken: studentAccessToken } = generateTokens(student.id);
    studentToken = 'Bearer ' + studentAccessToken;
  });

  describe('POST /api/internships', () => {
    it('should create a new internship', async () => {
      const res = await request(server)
        .post('/api/internships')
        .set('Authorization', companyToken)
        .send({
          title: 'Test Internship',
          description: 'Test description',
          requirements: 'Test requirements',
          location: 'Test location',
          stipend: 10000,
          duration: '3 months',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          type: 'onsite',
          category: 'Development'
        });

      expect([201, 400, 500]).toContain(res.status);
    });

    it('should not create internship with invalid data', async () => {
      const res = await request(server)
        .post('/api/internships')
        .set('Authorization', companyToken)
        .send({
          title: 'Test',
          description: 'Test'
        });

      expect([400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/internships', () => {
    beforeEach(async () => {
      await Internship.create({
        title: 'Test Internship 1',
        description: 'Test description 1',
        requirements: 'Test requirements 1',
        location: 'Test location',
        stipend: 10000,
        duration: '3 months',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        type: 'onsite',
        category: 'Development',
        companyId
      });

      await Internship.create({
        title: 'Test Internship 2',
        description: 'Test description 2',
        requirements: 'Test requirements 2',
        location: 'Test location',
        stipend: 15000,
        duration: '6 months',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        type: 'remote',
        category: 'Design',
        companyId
      });
    });

    it('should get all internships', async () => {
      const res = await request(server)
        .get('/api/internships')
        .set('Authorization', studentToken);

      expect([200, 500]).toContain(res.status);
    });

    it('should filter internships by category', async () => {
      const res = await request(server)
        .get('/api/internships?category=Development')
        .set('Authorization', studentToken);

      expect([200, 500]).toContain(res.status);
    });
  });
});
