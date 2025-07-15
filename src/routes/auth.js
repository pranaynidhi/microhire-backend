const express = require('express');

const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const authController = require('../controllers/authController');
const passport = require('../config/passport');
const { verifyEmail } = require('../controllers/authController');
const { User } = require('../models');
const { generateTokens } = require('../utils/tokenUtils');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user identity management
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Retrieve the profile information of the currently authenticated user
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Current user information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *     description: Update the role of the current user (student or company)
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, company]
 *                 description: New role for the user
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid role provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *     description: Verify user email address using the verification token sent via email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid or expired verification token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address using token (API)
 *     description: Verify user email address using the verification token via API call
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid or expired verification token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resend email verification link to user's email address
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Email already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/resend-verification', authController.resendVerificationEmail);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with the provided information
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password (minimum 6 characters)
 *               role:
 *                 type: string
 *                 enum: [student, company]
 *                 description: User role (student or company)
 *               bio:
 *                 type: string
 *                 description: User biography (optional)
 *               skills:
 *                 type: string
 *                 description: User skills (optional, for students)
 *               companyName:
 *                 type: string
 *                 description: Company name (required for company role)
 *               contactPerson:
 *                 type: string
 *                 description: Contact person name (for company role)
 *               companyDescription:
 *                 type: string
 *                 description: Company description (for company role)
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Company website URL (for company role)
 *               phone:
 *                 type: string
 *                 description: Phone number (optional)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticate user with email and password to receive JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', require('../controllers/authController').login);

/**
 * @swagger
 * /api/auth/oauth/{provider}:
 *   get:
 *     summary: OAuth login (Google, GitHub, etc.)
 *     description: Initiate OAuth authentication flow with the specified provider
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github]
 *         description: OAuth provider name
 *     responses:
 *       302:
 *         description: Redirect to OAuth provider for authentication
 *       400:
 *         description: Unsupported OAuth provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *     description: Generate and setup two-factor authentication for the current user
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: 2FA setup information generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 secret:
 *                   type: string
 *                   description: 2FA secret key
 *                 otpauth_url:
 *                   type: string
 *                   description: OTP authentication URL
 *                 qr:
 *                   type: string
 *                   format: data-url
 *                   description: QR code data URL for authenticator apps
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *     description: Verify the two-factor authentication code provided by the user
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 2FA verification code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid 2FA code or 2FA not set up
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
      window: 1,
    });
    if (!verified) return res.status(400).json({ message: 'Invalid 2FA code' });
    // Optionally, mark 2FA as verified in user profile
    await User.update({ twoFAEnabled: true }, { where: { id: req.user.id } });
    res.json({ message: '2FA verified' });
    
  } catch (error) {
    next(error);
    
  }
});

/**
 * @swagger
 * /api/auth/oauth/google:
 *   get:
 *     summary: Google OAuth login
 *     description: Initiate Google OAuth authentication flow
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
// Google OAuth
router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/auth/oauth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handle Google OAuth callback and authenticate user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Google OAuth successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         description: OAuth authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/oauth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
  (req, res) => {
    // Issue your JWT here and send to frontend
    // Example:
    // const { accessToken, refreshToken } = generateTokens(req.user.id);
    // res.json({ user: req.user, accessToken, refreshToken });
    res.json({ user: req.user, message: 'Google OAuth successful' });
  }
);

/**
 * @swagger
 * /api/auth/oauth/github:
 *   get:
 *     summary: GitHub OAuth login
 *     description: Initiate GitHub OAuth authentication flow
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth
 */
// GitHub OAuth
router.get('/oauth/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * @swagger
 * /api/auth/oauth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     description: Handle GitHub OAuth callback and authenticate user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: GitHub OAuth successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         description: OAuth authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/oauth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
  (req, res) => {
    // Issue your JWT here and send to frontend
    res.json({ user: req.user, message: 'GitHub OAuth successful' });
  }
);

/**
 * @swagger
 * /api/auth/oauth/failure:
 *   get:
 *     summary: OAuth failure
 *     description: Handle OAuth authentication failures
 *     tags: [Auth]
 *     responses:
 *       401:
 *         description: OAuth login failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/oauth/failure', (req, res) => {
  res.status(401).json({ message: 'OAuth login failed' });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout the current user and invalidate tokens
 *     tags: [Auth]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', authenticate, (req, res) => {
  // In a real implementation, you might want to blacklist the token
  res.json({ success: true, message: 'Logout successful' });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: New JWT refresh token
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
    next(error);
    
  }
});

// TODO: Define or import updateUserClaims and createCustomToken if you use them in this file.

module.exports = router;
