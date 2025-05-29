
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
      'search_performed'
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
  }
}, {
  tableName: 'analytics',
  timestamps: true
});

module.exports = Analytics;
