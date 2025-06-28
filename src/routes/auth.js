const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const authController = require('../controllers/authController');
const passport = require('../config/passport');
const { verifyEmail } = require('../controllers/authController');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { User } = require('../models');

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

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email address using token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification token
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address using token (API)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification token
 */
router.post('/verify-email', verifyEmail);

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
router.get('/oauth/:provider', (req, res, next) => {
  const { provider } = req.params;
  if (provider === 'google') {
    return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
  if (provider === 'github') {
    return passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  }
  return res.status(400).json({ message: 'Unsupported OAuth provider' });
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
router.post('/2fa/setup', authenticate, async (req, res, next) => {
  try {
    // Generate a secret for the user
    const secret = speakeasy.generateSecret({ length: 20, name: `MicroHire (${req.user.email})` });
    // Save the secret to the user profile (in production, encrypt this!)
    await User.update({ twoFASecret: secret.base32 }, { where: { id: req.user.id } });
    // Generate QR code for authenticator apps
    const qr = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, otpauth_url: secret.otpauth_url, qr });
  } catch (error) {
    next(error);
  }
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
router.post('/2fa/verify', authenticate, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: '2FA code is required' });
    // Fetch user's 2FA secret
    const user = await User.findByPk(req.user.id);
    if (!user || !user.twoFASecret) return res.status(400).json({ message: '2FA not set up' });
    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: code,
      window: 1
    });
    if (!verified) return res.status(400).json({ message: 'Invalid 2FA code' });
    // Optionally, mark 2FA as verified in user profile
    await User.update({ twoFAEnabled: true }, { where: { id: req.user.id } });
    res.json({ message: '2FA verified' });
  } catch (error) {
    next(error);
  }
});

// Google OAuth
router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/oauth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
  (req, res) => {
    // Issue your JWT here and send to frontend
    // Example:
    // const { accessToken, refreshToken } = generateTokens(req.user.id);
    // res.json({ user: req.user, accessToken, refreshToken });
    res.json({ user: req.user, message: 'Google OAuth successful' });
  }
);

// GitHub OAuth
router.get('/oauth/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/oauth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
  (req, res) => {
    // Issue your JWT here and send to frontend
    res.json({ user: req.user, message: 'GitHub OAuth successful' });
  }
);

router.get('/oauth/failure', (req, res) => {
  res.status(401).json({ message: 'OAuth login failed' });
});

// TODO: Define or import updateUserClaims and createCustomToken if you use them in this file.

module.exports = router;
