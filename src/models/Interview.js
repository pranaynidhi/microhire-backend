const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id',
  },
  applicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'applications',
      key: 'id',
    },
    field: 'application_id',
  },
  interviewDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'interview_date',
  },
  interviewType: {
    type: DataTypes.ENUM('phone', 'video', 'onsite'),
    allowNull: false,
    field: 'interview_type',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'location',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notes',
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no_show'),
    allowNull: false,
    defaultValue: 'scheduled',
    field: 'status',
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'feedback',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
    field: 'rating',
  },
}, {
  tableName: 'interviews',
  timestamps: true,
  paranoid: true,
  underscored: true,
});

module.exports = Interview; 