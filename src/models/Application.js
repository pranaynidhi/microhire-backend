const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define(
  'Application',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    internshipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Internships',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [50, 2000],
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'withdrawn'),
      defaultValue: 'pending',
    },
    appliedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['internshipId', 'userId'],
      },
    ],
  }
);

module.exports = Application;
