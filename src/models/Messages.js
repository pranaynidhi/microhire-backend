const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000],
      },
    },
    messageType: {
      type: DataTypes.ENUM('text', 'file', 'system'),
      defaultValue: 'text',
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    conversationId: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['senderId', 'receiverId'],
      },
      {
        fields: ['conversationId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

// Instance method to generate conversation ID
Message.generateConversationId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort((a, b) => a - b);
  return `conv_${sortedIds[0]}_${sortedIds[1]}`;
};

module.exports = Message;
