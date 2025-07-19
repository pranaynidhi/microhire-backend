'use strict';

const { Model, DataTypes } = require('sequelize');

class Conversation extends Model {
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
  Conversation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    participant1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'participant1_id',
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
    },
    participant2Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'participant2_id',
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
    },
    lastMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'last_message_id',
      // Temporarily removing the foreign key constraint to resolve the missing 'messages' table issue
      // references: {
      //   model: 'messages',
      //   key: 'id',
      // },
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_message_at',
    },
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['participant1_id', 'participant2_id'],
      },
    ],
  });
  
  return Conversation;
};