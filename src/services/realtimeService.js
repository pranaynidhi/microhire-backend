class RealtimeService {
    constructor(io) {
      this.io = io;
    }
  
    // Send notification to specific user
    sendNotificationToUser(userId, notification) {
      this.io.to(`user_${userId}`).emit('new_notification', notification);
    }
  
    // Send message notification
    sendMessageNotification(receiverId, message) {
      this.io.to(`user_${receiverId}`).emit('new_message', message);
    }
  
    // Send application status update
    sendApplicationUpdate(userId, application) {
      this.io.to(`user_${userId}`).emit('application_update', application);
    }
  
    // Send internship update to all connected users
    broadcastInternshipUpdate(internship) {
      this.io.emit('internship_update', internship);
    }
  
    // Send system announcement
    sendSystemAnnouncement(announcement) {
      this.io.emit('system_announcement', announcement);
    }
  
    // Get online users count
    getOnlineUsersCount() {
      return this.io.sockets.sockets.size;
    }
  
    // Send user status update
    sendUserStatusUpdate(userId, status) {
      this.io.emit('user_status_change', {
        userId,
        status,
        timestamp: new Date(),
      });
    }
  }
  
  module.exports = RealtimeService;
  