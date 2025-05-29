const express = require('express');
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All message routes require authentication
router.use(verifyToken);

// Send a message
router.post('/', sendMessage);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Get conversation with specific user
router.get('/conversation/:userId', getConversation);

// Mark conversation as read
router.patch('/conversation/:conversationId/read', markAsRead);

module.exports = router;
