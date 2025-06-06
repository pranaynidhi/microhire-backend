const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CertificateView = sequelize.define('CertificateView', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  certificateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Certificates',
      key: 'id'
    }
  },
  viewedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = CertificateView;
