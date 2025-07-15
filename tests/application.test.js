const request = require('supertest');
const { app } = require('./setupTest');
const { User, Internship, Application } = require('../src/models');
const { generateTokens } = require('../src/controllers/authController');

describe('Applications', () => {
  let companyToken;
  let studentToken;
  let companyId;
  let studentId;
  let internshipId;

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
      emailVerified: true,
    });
    companyId = company.id;
    const { accessToken: companyAccessToken } = generateTokens(company.id);
    companyToken = `Bearer ${companyAccessToken}`;

    // Create student user
    const student = await User.create({
      fullName: 'Test Student',
      email: `student${timestamp}@test.com`,
      password: 'Test123!@#',
      role: 'student',
      isActive: true,
      emailVerified: true,
    });
    studentId = student.id;
    const { accessToken: studentAccessToken } = generateTokens(student.id);
    studentToken = `Bearer ${studentAccessToken}`;

    // Create internship
    const internship = await Internship.create({
      title: 'Test Internship',
      description: 'Test description',
      requirements: 'Test requirements',
      location: 'Test location',
      stipend: 10000,
      duration: '3 months',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      type: 'onsite',
      category: 'Development',
      companyId,
    });
    internshipId = internship.id;
  }, 15000); // Increased timeout to 15 seconds

  describe('POST /api/applications', () => {
    it('should create a new application', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', studentToken)
        .send({
          internshipId,
          coverLetter:
            'This is a comprehensive cover letter that meets the minimum length requirement of 50 characters for the application validation.',
          resume: 'test-resume.pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application).toHaveProperty('id');
    }, 15000); // Increased timeout to 15 seconds

    it('should not create application with invalid data', async () => {
      // Create a valid internship first
      const internship = await Internship.create({
        title: 'Test Internship for Invalid Data',
        description: 'Test description',
        requirements: 'Test requirements',
        location: 'Test location',
        duration: '3 months',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        companyId,
        status: 'active',
      });

      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', studentToken)
        .send({
          internshipId: internship.id,
          coverLetter: '', // Invalid: empty cover letter
        });

      expect([400, 404, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    }, 15000); // Increased timeout to 15 seconds
  });

  describe('GET /api/applications', () => {
    beforeEach(async () => {
      await Application.create({
        internshipId,
        studentId: (await User.findOne({ where: { role: 'student' } })).id,
        coverLetter:
          'This is a comprehensive cover letter that meets the minimum length requirement of 50 characters for the application validation.',
        resume: 'test-resume.pdf',
        status: 'pending',
      });
    }, 15000); // Increased timeout to 15 seconds

    it('should get all applications for student', async () => {
      const res = await request(app).get('/api/applications').set('Authorization', studentToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.applications).toHaveLength(1);
    }, 15000); // Increased timeout to 15 seconds

    it('should get all applications for company', async () => {
      const res = await request(app).get('/api/applications').set('Authorization', companyToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.applications).toHaveLength(1);
    }, 15000); // Increased timeout to 15 seconds
  });

  describe('PATCH /api/applications/:id/status', () => {
    let applicationId;

    beforeEach(async () => {
      const application = await Application.create({
        internshipId,
        studentId: (await User.findOne({ where: { role: 'student' } })).id,
        coverLetter:
          'This is a comprehensive cover letter that meets the minimum length requirement of 50 characters for the application validation.',
        resume: 'test-resume.pdf',
        status: 'pending',
      });
      applicationId = application.id;
    }, 15000); // Increased timeout to 15 seconds

    it('should update application status', async () => {
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', companyToken)
        .send({ status: 'accepted' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('accepted');
    }, 15000); // Increased timeout to 15 seconds
  });
}, 30000); // Increased overall timeout to 30 seconds
