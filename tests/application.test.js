const request = require('supertest');
const app = require('../server');
const { User, Internship, Application } = require('../models');
const { generateToken } = require('../utils/auth');

describe('Applications', () => {
  let companyToken;
  let studentToken;
  let companyId;
  let studentId;
  let internshipId;

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
    studentId = student.id;
    studentToken = generateToken(student.id);

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
      companyId
    });
    internshipId = internship.id;
  });

  describe('POST /api/applications', () => {
    it('should create a new application', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          internshipId,
          coverLetter: 'Test cover letter'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application).toHaveProperty('id');
    });

    it('should not create duplicate application', async () => {
      await Application.create({
        studentId,
        internshipId,
        coverLetter: 'Test cover letter',
        status: 'pending'
      });

      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          internshipId,
          coverLetter: 'Test cover letter'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/applications/:id/status', () => {
    let applicationId;

    beforeEach(async () => {
      const application = await Application.create({
        studentId,
        internshipId,
        coverLetter: 'Test cover letter',
        status: 'pending'
      });
      applicationId = application.id;
    });

    it('should update application status', async () => {
      const res = await request(app)
        .put(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          status: 'accepted'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('accepted');
    });

    it('should not update status with invalid value', async () => {
      const res = await request(app)
        .put(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          status: 'invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
