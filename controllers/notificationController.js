const { Notification, User } = require('../models');
const { Op } = require('sequelize');

const createNotification = async (userId, title, message, type, metadata = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      metadata,
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      userId,
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } }
      ],
    };

    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    await notification.update({
      isRead: true,
      readAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          userId,
          isRead: false,
        },
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.count({
      where: {
        userId,
        isRead: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ],
      },
    });

    res.json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// Notification helper functions
const notificationHelpers = {
  // Application notifications
  applicationReceived: async (companyUserId, studentName, internshipTitle) => {
    await createNotification(
      companyUserId,
      'New Application Received',
      `${studentName} has applied for your internship: ${internshipTitle}`,
      'application_received',
      { studentName, internshipTitle }
    );
  },

  applicationStatusChanged: async (studentUserId, status, internshipTitle, companyName) => {
    const statusMessages = {
      accepted: `Congratulations! Your application for ${internshipTitle} at ${companyName} has been accepted.`,
      rejected: `Your application for ${internshipTitle} at ${companyName} was not selected this time.`,
    };

    await createNotification(
      studentUserId,
      'Application Status Update',
      statusMessages[status],
      'application_status_changed',
      { status, internshipTitle, companyName }
    );
  },

  newMessage: async (receiverId, senderName) => {
    await createNotification(
      receiverId,
      'New Message',
      `You have a new message from ${senderName}`,
      'new_message',
      { senderName }
    );
  },

  internshipDeadline: async (studentUserId, internshipTitle, daysLeft) => {
    await createNotification(
      studentUserId,
      'Application Deadline Reminder',
      `Only ${daysLeft} days left to apply for ${internshipTitle}`,
      'internship_deadline',
      { internshipTitle, daysLeft }
    );
  },
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  notificationHelpers,
};
