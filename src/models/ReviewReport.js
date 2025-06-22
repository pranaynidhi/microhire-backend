// models/ReviewReport.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReviewReport = sequelize.define('ReviewReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reviewId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Reviews',
      key: 'id'
    }
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.ENUM(
      'inappropriate_content',
      'fake_review',
      'harassment',
      'spam',
      'other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ReviewReports',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['review_id', 'reporter_id'],
      unique: true
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = ReviewReport;