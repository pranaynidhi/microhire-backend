const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { createCustomToken, updateUserClaims } = require('../config/firebase');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const authController = require('../controllers/authController');
const passport = require('passport'); // For OAuth stubs

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user identity
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Current user info
 */
// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

/**
 * @swagger
 * /api/auth/role:
 *   post:
 *     summary: Update user role
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, company]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid role
 */
// Update user role
router.post('/role', authenticate, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'company'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    await updateUserClaims(req.user.uid, { role });
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Request email verification token
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Custom token for email verification
 *       400:
 *         description: Email already verified
 */
// Verify email
router.post('/verify-email', authenticate, async (req, res, next) => {
  try {
    if (req.user.emailVerified) {
      throw new AppError('Email already verified', 400);
    }

    // Create custom token for email verification
    const customToken = await createCustomToken(req.user.uid, {
      emailVerification: true
    });

    res.json({ customToken });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, business]
 *               bio:
 *                 type: string
 *               skills:
 *                 type: string
 *               companyName:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               companyDescription:
 *                 type: string
 *               website:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user exists
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', require('../controllers/authController').login);

/**
 * @swagger
 * /api/auth/oauth/{provider}:
 *   get:
 *     summary: OAuth login (Google, GitHub, etc.)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github]
 *     responses:
 *       302:
 *         description: Redirect to OAuth provider
 */
router.get('/oauth/:provider', (req, res) => {
  // Placeholder: Implement with passport or similar
  res.status(501).json({ message: 'OAuth login not implemented yet' });
});

/**
 * @swagger
 * /api/auth/firebase:
 *   post:
 *     summary: Login with Firebase ID token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid Firebase token
 */
router.post('/firebase', (req, res) => {
  // Placeholder: Implement Firebase login
  res.status(501).json({ message: 'Firebase login not implemented yet' });
});

/**
 * @swagger
 * /api/auth/2fa/setup:
 *   post:
 *     summary: Setup 2FA for user
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: 2FA setup info (QR code, secret)
 */
router.post('/2fa/setup', authenticate, (req, res) => {
  // Placeholder: Implement 2FA setup (e.g., using speakeasy)
  res.status(501).json({ message: '2FA setup not implemented yet' });
});

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     summary: Verify 2FA code
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA verified
 *       400:
 *         description: Invalid 2FA code
 */
router.post('/2fa/verify', authenticate, (req, res) => {
  // Placeholder: Implement 2FA verification
  res.status(501).json({ message: '2FA verification not implemented yet' });
});

module.exports = router;
