const request = require('supertest');
const app = require('../server');
const { User } = require('../models');

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new student', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Student',
          email: 'student@test.com',
          password: 'Test123!@#',
          role: 'student',
          bio: 'Test bio',
          skills: 'JavaScript, React'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.token).toBeDefined();
    });

    it('should register a new business', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Company',
          email: 'company@test.com',
          password: 'Test123!@#',
          role: 'business',
          companyName: 'Test Company',
          contactPerson: 'John Doe',
          companyDescription: 'Test description'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.token).toBeDefined();
    });

    it('should not register with existing email', async () => {
      await User.create({
        fullName: 'Existing User',
        email: 'existing@test.com',
        password: 'Test123!@#',
        role: 'student'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'New User',
          email: 'existing@test.com',
          password: 'Test123!@#',
          role: 'student'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        fullName: 'Test User',
        email: 'test@test.com',
        password: 'Test123!@#',
        role: 'student'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'Test123!@#'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
