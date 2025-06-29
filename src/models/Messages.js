const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'conversation_id',
      references: {
        model: 'conversations',
        key: 'id',
      },
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'receiver_id',
      references: {
        model: 'users',
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
      field: 'message_type',
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_url',
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_name',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at',
    },
  },
  {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['conversation_id'],
      },
      {
        fields: ['sender_id'],
      },
      {
        fields: ['created_at'],
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
