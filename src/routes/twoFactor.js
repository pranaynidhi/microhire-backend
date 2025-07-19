const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const TwoFactorController = require('../controllers/twoFactorController');

/**
 * @swagger
 * tags:
 *   name: Two-Factor Authentication
 *   description: Two-factor authentication management
 */

/**
 * @swagger
 * /api/2fa/setup:
 *   get:
 *     summary: Start 2FA setup
 *     description: Generate a new 2FA secret and QR code
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     qrCodeUrl:
 *                       type: string
 *                       description: URL of the QR code to scan with authenticator app
 *                     secret:
 *                       type: string
 *                       description: The 2FA secret (for development only)
 */
router.get('/setup', authenticate, TwoFactorController.setup2FA);

/**
 * @swagger
 * /api/2fa/verify:
 *   post:
 *     summary: Verify and enable 2FA
 *     description: Verify the 2FA setup and enable it for the user
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
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
 *                 description: The 2FA token from the authenticator app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     recoveryCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Recovery codes (display only once)
 */
router.post('/verify', authenticate, TwoFactorController.verify2FA);

/**
 * @swagger
 * /api/2fa/disable:
 *   post:
 *     summary: Disable 2FA
 *     description: Disable 2FA for the current user
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 */
router.post('/disable', authenticate, TwoFactorController.disable2FA);

/**
 * @swagger
 * /api/2fa/verify-login:
 *   post:
 *     summary: Verify 2FA token for login
 *     description: Verify a 2FA token during login
 *     tags: [Two-Factor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - email
 *             properties:
 *               token:
 *                 type: string
 *                 description: The 2FA token from the authenticator app
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: 2FA verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 */
router.post('/verify-login', TwoFactorController.verifyToken);

/**
 * @swagger
 * /api/2fa/recovery-codes:
 *   get:
 *     summary: Generate new recovery codes
 *     description: Generate new recovery codes for 2FA
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New recovery codes generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recoveryCodes:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/recovery-codes', authenticate, TwoFactorController.generateRecoveryCodes);

/**
 * @swagger
 * /api/2fa/recover:
 *   post:
 *     summary: Recover account using recovery code
 *     description: Use a recovery code to bypass 2FA
 *     tags: [Two-Factor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - email
 *             properties:
 *               code:
 *                 type: string
 *                 description: A recovery code
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Recovery successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     recoveryCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Remaining recovery codes
 */
router.post('/recover', TwoFactorController.verifyRecoveryCode);

module.exports = router;
