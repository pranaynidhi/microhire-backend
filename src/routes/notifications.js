const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All notification routes require authentication
router.use(verifyToken);

// Get notifications for current user
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark specific notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

module.exports = router;
