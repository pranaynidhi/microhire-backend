const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  certificateId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  internshipId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Internships',
      key: 'id'
    }
  },
  studentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  internshipTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  skills: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  performance: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  issuedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  revokedReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shareToken: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  shareExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'Certificates',
  timestamps: true
});

module.exports = Certificate;
