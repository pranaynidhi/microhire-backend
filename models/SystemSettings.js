const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'general',
      'security',
      'email',
      'notifications',
      'content',
      'limits'
    ),
    allowNull: false
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'SystemSettings',
  timestamps: true
});

module.exports = SystemSettings;
