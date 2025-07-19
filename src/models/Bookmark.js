'use strict';

const { Model, DataTypes } = require('sequelize');

class Bookmark extends Model {
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
  Bookmark.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
      field: 'user_id',
    },
    internshipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'internships', // Must match the actual table name in the database (lowercase)
        key: 'id',
      },
      field: 'internship_id',
    },
  }, {
    sequelize,
    modelName: 'Bookmark',
    tableName: 'bookmarks',
    tableName: 'bookmarks',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'internship_id'],
      },
    ],
  });
  
  return Bookmark;
};