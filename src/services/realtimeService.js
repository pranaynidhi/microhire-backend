class RealtimeService {
  constructor(io) {
    this.io = io;
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('new_notification', notification);
    }
  }

  // Send message notification
  sendMessageNotification(receiverId, message) {
    if (this.io) {
      this.io.to(`user_${receiverId}`).emit('new_message', message);
    }
  }

  // Send application status update
  sendApplicationUpdate(userId, application) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('application_update', application);
    }
  }

  // Send internship update to all connected users
  broadcastInternshipUpdate(internship) {
    if (this.io) {
      this.io.emit('internship_update', internship);
    }
  }

  // Send system announcement
  sendSystemAnnouncement(announcement) {
    if (this.io) {
      this.io.emit('system_announcement', announcement);
    }
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.io ? this.io.sockets.sockets.size : 0;
  }

  // Send user status update
  sendUserStatusUpdate(userId, status) {
    if (this.io) {
      this.io.emit('user_status_change', {
        userId,
        status,
        timestamp: new Date(),
      });
    }
  }
}

// Singleton instance
let instance = null;

const initializeRealtimeService = (io) => {
  if (!instance) {
    instance = new RealtimeService(io);
  }
  return instance;
};

const getRealtimeService = () => {
  if (!instance) {
    throw new Error('RealtimeService not initialized. Call initializeRealtimeService first.');
  }
  return instance;
};

module.exports = {
  RealtimeService,
  initializeRealtimeService,
  getRealtimeService,
};
