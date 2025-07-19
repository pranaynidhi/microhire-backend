const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Analytics = sequelize.define(
  'Analytics',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      allowNull: false,
      field: 'event_type',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'target_id',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'session_id',
    },
    duration: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true,
    },
    referrer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
      allowNull: true,
      field: 'device_type',
    },
    browser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    os: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'analytics',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Analytics;
