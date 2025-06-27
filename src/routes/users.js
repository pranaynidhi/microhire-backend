const express = require('express');
const {
  getProfile,
  updateProfile,
  getMyApplications,
  getMyInternships,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const webpush = require('../services/webPushService');

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

let subscriptions = [];

/**
 * @swagger
 * /api/users/subscribe:
 *   post:
 *     summary: Subscribe to web push notifications
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscription:
 *                 type: object
 *     responses:
 *       201:
 *         description: Subscription saved
 */
router.post('/subscribe', (req, res) => {
  const { subscription } = req.body;
  if (!subscription) {
    return res.status(400).json({ message: 'Subscription is required' });
  }
  subscriptions.push(subscription);
  res.status(201).json({ message: 'Subscription saved' });
});

/**
 * @swagger
 * /api/users/notify:
 *   post:
 *     summary: Send a test web push notification to all subscribers
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification sent
 */
router.post('/notify', async (req, res) => {
  const { title, body } = req.body;
  const payload = JSON.stringify({ title, body });
  const results = [];
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      results.push({ success: true });
    } catch (err) {
      results.push({ success: false, error: err.message });
    }
  }
  res.json({ message: 'Notifications sent', results });
});

module.exports = router;
