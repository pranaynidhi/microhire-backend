const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SearchHistory = sequelize.define('SearchHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  query: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filters: {
    type: DataTypes.JSON,
    allowNull: true
  },
  resultCount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  clickedResults: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isSaved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  savedName: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'SearchHistories',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['is_saved']
    }
  ]
});

module.exports = SearchHistory;
