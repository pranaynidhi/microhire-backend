const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Application = sequelize.define(
  'Application',
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
        model: 'internships',
        key: 'id',
      },
      field: 'internship_id',
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes',
    },
  },
  {
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['internship_id', 'student_id'],
      },
    ],
    tableName: 'applications',
  }
);

module.exports = Application;
