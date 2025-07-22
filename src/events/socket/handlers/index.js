const messageHandlers = require('./messageHandlers');
const notificationHandlers = require('./notificationHandlers');
const roomHandlers = require('./roomHandlers');
const { applyErrorHandling } = require('../middleware/errorHandler');

// Combine all handlers
const allHandlers = {
  // Message events
  send_message: messageHandlers.handleSendMessage,
  message_read: messageHandlers.handleMessageRead,
  typing: messageHandlers.handleTyping,
  
  // Notification events
  mark_notification_read: notificationHandlers.handleMarkNotificationRead,
  mark_all_notifications_read: notificationHandlers.handleMarkAllNotificationsRead,
  
  // Room events
  join_conversation: roomHandlers.handleJoinConversation,
  leave_conversation: roomHandlers.handleLeaveConversation
};

// Apply error handling to all handlers
module.exports = applyErrorHandling(allHandlers);
