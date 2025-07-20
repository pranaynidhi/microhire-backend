'use strict';

const { Model, DataTypes } = require('sequelize');

class Report extends Model {
  // Associations are defined in src/models/associations.js
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  Report.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'reporter_id',
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
    },
    reportedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reported_user_id',
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
    },
    reportedInternshipId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reported_internship_id',
      references: {
        model: 'internships', // Must match the actual table name in the database (lowercase)
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('user', 'internship', 'application'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM(
        'spam',
        'inappropriate_content',
        'fake_profile',
        'harassment',
        'fraud',
        'other'
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'investigating', 'resolved', 'dismissed'),
      defaultValue: 'pending',
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
    resolvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'resolved_by',
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
    },
  }, {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true,
    underscored: true,
  });
  
  return Report;
};