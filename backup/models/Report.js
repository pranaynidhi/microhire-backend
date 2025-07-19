const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define(
  'Report',
  {
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
        model: 'users',
        key: 'id',
      },
    },
    reportedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reported_user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reportedInternshipId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reported_internship_id',
      references: {
        model: 'internships',
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
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'reports',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Report;
