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
    field: 'user_id',
    references: {
      model: 'users',
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
    allowNull: false,
    field: 'result_count'
  },
  clickedResults: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'clicked_results'
  },
  isSaved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_saved'
  },
  savedName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'saved_name'
  }
}, {
  tableName: 'search_histories',
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
