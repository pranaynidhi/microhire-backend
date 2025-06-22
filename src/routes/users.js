const express = require('express');
const {
  getProfile,
  updateProfile,
  getMyApplications,
  getMyInternships,
  updateFCMToken,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile
 */

router.use(authenticate); // All user routes require authentication

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated user profile
 */
router.put('/me', updateProfile);

/**
 * @swagger
 * /api/users/me/applications:
 *   get:
 *     summary: Get current user's applications
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get('/me/applications', getMyApplications);

/**
 * @swagger
 * /api/users/me/internships:
 *   get:
 *     summary: Get current user's internships
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of internships
 */
router.get('/me/internships', getMyInternships);

/**
 * @swagger
 * /api/users/fcm-token:
 *   post:
 *     summary: Update FCM token for push notifications
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated
 */
router.post('/fcm-token', updateFCMToken);

module.exports = router;
