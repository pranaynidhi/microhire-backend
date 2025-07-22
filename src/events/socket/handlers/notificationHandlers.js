const { Notification, User } = require('../../../models');
const { validateEvent } = require('../middleware/validation');
const logger = require('../../../utils/logger');
const Joi = require('joi');

/**
 * Handle marking a notification as read
 */
const handleMarkNotificationRead = async (socket, data) => {
  const { notificationId } = data;
  const userId = socket.user.id;
  
  try {
    // Find and update the notification
    const [updated] = await Notification.update(
      { read: true },
      {
        where: {
          id: notificationId,
          userId,
          read: false // Only update if not already read
        },
        returning: true
      }
    );
    
    if (updated > 0) {
      logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
      
      // Notify the user that the notification was updated
      socket.emit('notification_updated', {
        id: notificationId,
        read: true,
        updatedAt: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error marking notification as read:', {
      error: error.message,
      notificationId,
      userId
    });
    
    throw error;
  }
};

/**
 * Handle marking all notifications as read
 */
const handleMarkAllNotificationsRead = async (socket) => {
  const userId = socket.user.id;
  
  try {
    // Mark all user's unread notifications as read
    const [updated] = await Notification.update(
      { read: true },
      {
        where: {
          userId,
          read: false
        }
      }
    );
    
    if (updated > 0) {
      logger.info(`Marked all notifications as read for user ${userId}`);
      
      // Notify the user that all notifications were marked as read
      socket.emit('all_notifications_read', {
        count: updated,
        timestamp: new Date().toISOString()
      });
    }
    
    return { success: true, count: updated };
  } catch (error) {
    logger.error('Error marking all notifications as read:', {
      error: error.message,
      userId
    });
    
    throw error;
  }
};

// Export wrapped handlers with error handling
module.exports = {
  handleMarkNotificationRead: [
    validateEvent({
      notificationId: Joi.alternatives().try(Joi.string(), Joi.number()).required()
    }, 'mark_notification_read'),
    handleMarkNotificationRead
  ],
  handleMarkAllNotificationsRead: [
    handleMarkAllNotificationsRead
  ]
};
