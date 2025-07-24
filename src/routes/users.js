const express = require('express');
const bcrypt = require('bcryptjs');
const {
  getProfile,
  updateProfile,
  getMyApplications,
  getMyInternships,
  exportUserData,
  getActiveSessions,
  revokeSession,
} = require('../controllers/userController');
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const webpush = require('../services/webPushService');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

router.use(authenticate); // All user routes require authentication

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's profile
 *     description: Retrieve the complete profile information of the currently authenticated user, including notification and privacy settings.
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user's profile
 *     description: Update the profile information and settings of the currently authenticated user.
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
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
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *               emailNewInternships:
 *                 type: boolean
 *               emailApplicationUpdates:
 *                 type: boolean
 *               emailMessages:
 *                 type: boolean
 *               emailMarketing:
 *                 type: boolean
 *               pushMessages:
 *                 type: boolean
 *               pushDeadlines:
 *                 type: boolean
 *               profileVisibility:
 *                 type: string
 *                 enum: [public, companies, private]
 *               showOnlineStatus:
 *                 type: boolean
 *               searchEngineIndexing:
 *                 type: boolean
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/me', updateProfile);

/**
 * @swagger
 * /api/users/me/applications:
 *   get:
 *     summary: Get current user's applications
 *     description: Retrieve all internship applications submitted by the current user
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of applications per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, accepted, rejected, withdrawn]
 *         description: Filter applications by status
 *     responses:
 *       200:
 *         description: User applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/applications', getMyApplications);

/**
 * @swagger
 * /api/users/me/internships:
 *   get:
 *     summary: Get current user's internships
 *     description: Retrieve all internships created by the current company user or applied to by the current student user
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of internships per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, closed]
 *         description: Filter internships by status
 *     responses:
 *       200:
 *         description: User internships retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 internships:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Internship'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/internships', getMyInternships);

const subscriptions = [];

/**
 * @swagger
 * /api/users/subscribe:
 *   post:
 *     summary: Subscribe to web push notifications
 *     description: Subscribe the current user to receive web push notifications
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *                 description: Web push subscription object from the browser
 *                 properties:
 *                   endpoint:
 *                     type: string
 *                     description: Push service endpoint URL
 *                   keys:
 *                     type: object
 *                     properties:
 *                       p256dh:
 *                         type: string
 *                         description: P-256 DH key
 *                       auth:
 *                         type: string
 *                         description: Authentication secret
 *     responses:
 *       201:
 *         description: Subscription saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Subscription data is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *     description: Send a test web push notification to all subscribed users (admin functionality)
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *               body:
 *                 type: string
 *                 description: Notification body text
 *     responses:
 *       200:
 *         description: Notifications sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       error:
 *                         type: string
 *       400:
 *         description: Title and body are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/notify', async (req, res) => {
  const { title, body } = req.body;
  const payload = JSON.stringify({ title, body });
  const results = [];
  for (const sub of subscriptions) {
    try {
      // Validate subscription before sending
      if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
        results.push({ success: false, error: 'Invalid subscription format' });
        continue;
      }
      await webpush.sendNotification(sub, payload);
      results.push({ success: true });
    } catch (err) {
      results.push({ success: false, error: err.message });
    }
  }
  res.json({ message: 'Notifications sent', results });
});

/**
 * @swagger
 * /api/users/me/data:
 *   get:
 *     summary: Export user data
 *     description: Export all personal data associated with the current user's account, including applications, internships, messages, notifications, and reviews.
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: User data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *                 internships:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Internship'
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/data', exportUserData);

/**
 * @swagger
 * /api/users/me/sessions:
 *   get:
 *     summary: Get active sessions
 *     description: Retrieve all active sessions for the currently authenticated user.
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
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
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sessionId:
 *                             type: string
 *                           device:
 *                             type: string
 *                           ip:
 *                             type: string
 *                           userAgent:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           lastActive:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/sessions', getActiveSessions);

/**
 * @swagger
 * /api/users/me/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a session
 *     description: Revoke a specific active session for the currently authenticated user.
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/me/sessions/:sessionId', revokeSession);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve public profile information of a specific user
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Change user password
 *     description: Change the password of the currently authenticated user
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid current password or weak new password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/me/delete:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the current user's account and all associated data
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: User's password for confirmation
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/me/delete', authenticate, async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for account deletion',
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Delete user account (this will cascade to related data due to paranoid: true)
    await user.destroy();

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
