const express = require('express');

const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the user
 *     description: Retrieve all notifications for the current user
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticate, requireEmailVerification, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch(
  '/:id/read',
  authenticate,
  requireEmailVerification,
  notificationController.markAsRead
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch(
  '/read-all',
  authenticate,
  requireEmailVerification,
  notificationController.markAllAsRead
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete(
  '/:id',
  authenticate,
  requireEmailVerification,
  notificationController.deleteNotification
);

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     summary: Delete all notifications
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: All notifications deleted
 */
router.delete(
  '/',
  authenticate,
  requireEmailVerification,
  notificationController.deleteAllNotifications
);

module.exports = router;
