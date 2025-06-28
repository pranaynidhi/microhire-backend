const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
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
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of notifications
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
router.patch('/:id/read', authenticate, requireEmailVerification, notificationController.markAsRead);

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
router.patch('/read-all', authenticate, requireEmailVerification, notificationController.markAllAsRead);

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
router.delete('/:id', authenticate, requireEmailVerification, notificationController.deleteNotification);

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
router.delete('/', authenticate, requireEmailVerification, notificationController.deleteAllNotifications);

module.exports = router;
