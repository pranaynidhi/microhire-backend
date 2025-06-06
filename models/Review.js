const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  revieweeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  internshipId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Internships',
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
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastReportedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Reviews',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['reviewerId', 'revieweeId', 'internshipId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['reportCount']
    }
  ]
});

module.exports = Review;
