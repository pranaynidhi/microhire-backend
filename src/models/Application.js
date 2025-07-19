'use strict';

const { Model, DataTypes } = require('sequelize');

class Application extends Model {
  // Associations are defined in src/models/associations.js
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  Application.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id',
      },
      internshipId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'internships', // Must match the actual table name in the database (lowercase)
          key: 'id',
        },
        field: 'internship_id',
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Must match the actual table name in the database (lowercase)
          key: 'id',
        },
        field: 'student_id',
      },
      coverLetter: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [50, 2000],
        },
        field: 'cover_letter',
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'withdrawn'),
        defaultValue: 'pending',
        field: 'status',
      },
      appliedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'applied_at',
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at',
      },
      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Must match the actual table name in the database (lowercase)
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        field: 'reviewed_by',
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'feedback',
      },
    },
    {
      sequelize,
      modelName: 'Application',
      tableName: 'applications',
      timestamps: true,
      underscored: true,
      paranoid: true,
    }
  );

  return Application;
};
