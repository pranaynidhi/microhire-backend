const request = require('supertest');
const app = require('../server');
const { User, Internship, Review } = require('../models');
const { generateToken } = require('../utils/auth');

describe('Reviews', () => {
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

    // Create completed internship
    const internship = await Internship.create({
      title: 'Test Internship',
      description: 'Test description',
      requirements: 'Test requirements',
      location: 'Test location',
      stipend: 10000,
      duration: '3 months',
      deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'onsite',
      category: 'Development',
      companyId,
      studentId,
      status: 'completed'
    });
    internshipId = internship.id;
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          internshipId,
          rating: 5,
          comment: 'Great experience!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review).toHaveProperty('id');
    });

    it('should not create review for incomplete internship', async () => {
      await Internship.update(
        { status: 'active' },
        { where: { id: internshipId } }
      );

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          internshipId,
          rating: 5,
          comment: 'Great experience!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews', () => {
    beforeEach(async () => {
      await Review.create({
        reviewerId: studentId,
        revieweeId: companyId,
        internshipId,
        rating: 5,
        comment: 'Great experience!',
        type: 'student'
      });
    });

    it('should get reviews for a user', async () => {
      const res = await request(app)
        .get(`/api/reviews?userId=${companyId}`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toHaveLength(1);
    });
  });
});
