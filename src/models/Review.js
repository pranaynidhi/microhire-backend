const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reviewer_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  revieweeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reviewee_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  internshipId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'internship_id',
    references: {
      model: 'internships',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('student_to_company', 'company_to_student'),
    allowNull: false
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_visible'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'admin_notes'
  },
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'report_count'
  },
  lastReportedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_reported_at'
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['reviewer_id', 'reviewee_id', 'internship_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['report_count']
    }
  ]
});

module.exports = Review;
