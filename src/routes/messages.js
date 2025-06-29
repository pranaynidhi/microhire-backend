const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const messageController = require('../controllers/messageController');
const { Conversation, Message } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messaging and conversation management
 */

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get all conversations for the user
 *     description: Retrieve all conversations where the current user is a participant
 *     tags: [Messages]
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
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       participants:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/User'
 *                       lastMessage:
 *                         $ref: '#/components/schemas/Message'
 *                       unreadCount:
 *                         type: integer
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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
router.get('/conversations', authenticate, requireEmailVerification, messageController.getConversations);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   get:
 *     summary: Get messages in a conversation
 *     description: Retrieve all messages in a specific conversation
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
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
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - you can only view conversations you're part of
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/conversations/:conversationId', authenticate, requireEmailVerification, messageController.getConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   post:
 *     summary: Send a message in a conversation
 *     description: Send a new message in an existing conversation
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URLs to attached files
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - you can only send messages in conversations you're part of
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/conversations/:conversationId', authenticate, requireEmailVerification, messageController.sendMessage);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/read:
 *   patch:
 *     summary: Mark conversation as read
 *     description: Mark all messages in a conversation as read by the current user
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/conversations/:conversationId/read', authenticate, requireEmailVerification, messageController.markAsRead);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation
 *     description: Delete a conversation and all its messages (only for the current user)
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/conversations/:conversationId', authenticate, requireEmailVerification, messageController.deleteMessage);

/**
 * @swagger
 * /api/messages/conversations:
 *   post:
 *     summary: Create a new conversation
 *     description: Create a new conversation with another user
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: integer
 *                 description: ID of the user to start conversation with
 *               initialMessage:
 *                 type: string
 *                 description: Optional initial message
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Participant user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/conversations', authenticate, requireEmailVerification, async (req, res, next) => {
  try {
    const { participantId, message } = req.body;
    
    if (!participantId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID and message are required'
      });
    }
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { participant1Id: req.user.id, participant2Id: participantId },
          { participant1Id: participantId, participant2Id: req.user.id }
        ]
      }
    });
    
    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participant1Id: req.user.id,
        participant2Id: participantId
      });
    }
    
    // Create the message
    const newMessage = await Message.create({
      conversationId: conversation.id,
      senderId: req.user.id,
      receiverId: participantId,
      content: message
    });
    
    // Update conversation last message
    await conversation.update({
      lastMessageId: newMessage.id,
      lastMessageAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Conversation created and message sent',
      conversation,
      message: newMessage
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/messages/{messageId}:
 *   put:
 *     summary: Edit a message
 *     description: Edit a message that was sent by the current user
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated message content
 *     responses:
 *       200:
 *         description: Message updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: You can only edit your own messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:messageId', authenticate, requireEmailVerification, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user owns the message
    if (message.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }
    
    // Check if message is not too old (e.g., within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.createdAt < fiveMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: 'Messages can only be edited within 5 minutes of sending'
      });
    }
    
    await message.update({
      content,
      editedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Message updated successfully',
      message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     description: Delete a message that was sent by the current user
 *     tags: [Messages]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: You can only delete your own messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:messageId', authenticate, requireEmailVerification, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user owns the message
    if (message.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }
    
    // Check if message is not too old (e.g., within 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (message.createdAt < tenMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: 'Messages can only be deleted within 10 minutes of sending'
      });
    }
    
    await message.destroy();
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
