'use strict';

const { Model, DataTypes } = require('sequelize');

class SearchHistory extends Model {
  // Associations are defined in src/models/associations.js
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  SearchHistory.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
    },
    query: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    resultCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'result_count',
    },
    clickedResults: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'clicked_results',
    },
    isSaved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_saved',
    },
    savedName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'saved_name',
    },
  }, {
    sequelize,
    modelName: 'SearchHistory',
    tableName: 'search_histories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'created_at'],
      },
      {
        fields: ['is_saved'],
      },
    ],
  });
  
  return SearchHistory;
};