const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CertificateView = sequelize.define(
  'CertificateView',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    certificateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'certificate_id',
      references: {
        model: 'certificates',
        key: 'id',
      },
    },
    viewedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'viewed_at',
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'user_agent',
    },
  },
  {
    tableName: 'certificate_views',
    timestamps: true,
    underscored: true,
  }
);

module.exports = CertificateView;
