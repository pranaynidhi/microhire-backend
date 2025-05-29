// models/Review.js
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
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['reviewerId', 'revieweeId', 'internshipId']
    }
  ]
});

module.exports = Review;
