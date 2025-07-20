'use strict';

const { Model, DataTypes } = require('sequelize');

class CertificateView extends Model {
  // Associations are defined in src/models/associations.js
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  CertificateView.init({
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
  }, {
    sequelize,
    modelName: 'CertificateView',
    tableName: 'certificate_views',
    timestamps: true,
    underscored: true,
  });
  
  return CertificateView;
};