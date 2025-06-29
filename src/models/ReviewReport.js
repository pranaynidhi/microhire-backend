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
    field: 'review_id',
    references: {
      model: 'reviews',
      key: 'id'
    }
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reporter_id',
    references: {
      model: 'users',
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
    allowNull: true,
    field: 'admin_notes'
  }
}, {
  tableName: 'review_reports',
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