'use strict';

const { Model, DataTypes } = require('sequelize');

class Interview extends Model {
  // Associations are defined in src/models/associations.js
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  Interview.init({
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
    sequelize,
    modelName: 'Interview',
    tableName: 'interviews',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });
  
  return Interview;
};