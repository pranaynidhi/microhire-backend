'use strict';

const { Model, DataTypes } = require('sequelize');

class SystemSettings extends Model {
  /**
   * Helper method for defining associations.
   * This method is not part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // Define associations here
    // Example:
    // this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  SystemSettings.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('general', 'security', 'email', 'notifications', 'content', 'limits'),
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'SystemSettings',
    tableName: 'system_settings',
    timestamps: true,
  });
  
  return SystemSettings;
};