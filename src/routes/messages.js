const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const messageController = require('../controllers/messageController');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messaging and conversations
 */

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get all conversations for the user
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', authenticate, requireEmailVerification, messageController.getConversations);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/conversations/:conversationId', authenticate, requireEmailVerification, messageController.getConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/conversations/:conversationId', authenticate, requireEmailVerification, messageController.sendMessage);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/read:
 *   patch:
 *     summary: Mark conversation as read
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Conversation marked as read
 */
router.patch('/conversations/:conversationId/read', authenticate, requireEmailVerification, messageController.markAsRead);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Conversation deleted
 */
router.delete('/conversations/:conversationId', authenticate, requireEmailVerification, messageController.deleteMessage);

module.exports = router;
