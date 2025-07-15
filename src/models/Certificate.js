const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Certificate = sequelize.define(
  'Certificate',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    certificateId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'certificate_id',
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    internshipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'internship_id',
      references: {
        model: 'internships',
        key: 'id',
      },
    },
    studentName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'student_name',
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'company_name',
    },
    internshipTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'internship_title',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    performance: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issuedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'issued_at',
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_valid',
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_revoked',
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at',
    },
    revokedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'revoked_reason',
    },
    shareToken: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'share_token',
    },
    shareExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'share_expires_at',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count',
    },
  },
  {
    tableName: 'certificates',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Certificate;
