const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
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
      model: 'users',
      key: 'id',
    },
  },
  participant2Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'participant2_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  lastMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'last_message_id',
    references: {
      model: 'messages',
      key: 'id',
    },
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at',
  },
}, {
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

module.exports = Conversation; 