'use strict';

const { Model, DataTypes } = require('sequelize');

class BaseModel extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // Define associations here in child models
  }
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
