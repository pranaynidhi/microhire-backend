const request = require('supertest');
const app = require('../server');
const { User, Internship } = require('../models');
const { generateToken } = require('../utils/auth');

describe('Internships', () => {
  let companyToken;
  let studentToken;
  let companyId;

  beforeEach(async () => {
    // Create company user
    const company = await User.create({
      fullName: 'Test Company',
      email: 'company@test.com',
      password: 'Test123!@#',
      role: 'business',
      companyName: 'Test Company'
    });
    companyId = company.id;
    companyToken = generateToken(company.id);

    // Create student user
    const student = await User.create({
      fullName: 'Test Student',
      email: 'student@test.com',
      password: 'Test123!@#',
      role: 'student'
    });
    studentToken = generateToken(student.id);
  });

  describe('POST /api/internships', () => {
    it('should create a new internship', async () => {
      const res = await request(app)
        .post('/api/internships')
        .set('Authorization', `Bearer ${companyToken}`)
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

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.internship).toHaveProperty('id');
    });

    it('should not create internship with invalid data', async () => {
      const res = await request(app)
        .post('/api/internships')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          title: 'Test',
          description: 'Test'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
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
      const res = await request(app)
        .get('/api/internships')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.internships).toHaveLength(2);
    });

    it('should filter internships by category', async () => {
      const res = await request(app)
        .get('/api/internships?category=Development')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.internships).toHaveLength(1);
      expect(res.body.data.internships[0].category).toBe('Development');
    });
  });
});
