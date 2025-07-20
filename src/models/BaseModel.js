'use strict';

const { Model, DataTypes } = require('sequelize');

class BaseModel extends Model {
  // Associations are defined in src/models/associations.js
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  BaseModel.init(
    {
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at'
      },
    },
    {
      sequelize,
      modelName: 'BaseModel',
      tableName: 'base_models',
      paranoid: true, // Enable soft delete
      timestamps: true,
      underscored: true,
    }
  );

  return BaseModel;
};
