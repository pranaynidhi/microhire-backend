const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventType: {
    type: DataTypes.ENUM(
      'user_registration',
      'internship_posted',
      'application_submitted',
      'application_accepted',
      'application_rejected',
      'profile_view',
      'search_performed',
      'certificate_generated',
      'certificate_verified',
      'review_submitted',
      'review_reported',
      'message_sent',
      'notification_sent',
      'login',
      'logout',
      'password_reset',
      'profile_update',
      'file_upload',
      'internship_view',
      'internship_share',
      'internship_bookmark'
    ),
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  referrer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviceType: {
    type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
    allowNull: true
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  },
  os: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Analytics',
  timestamps: true
});

module.exports = Analytics;
