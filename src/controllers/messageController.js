const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Message, User, Conversation } = require('../models');
const logger = require('../utils/logger');

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    // Validate receiver
    const receiver = await User.findOne({
      where: { id: receiverId, isActive: true },
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found',
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { participant1Id: senderId, participant2Id: receiverId },
          { participant1Id: receiverId, participant2Id: senderId },
        ],
      },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participant1Id: senderId,
        participant2Id: receiverId,
        lastMessageAt: new Date(),
      });
    }

    // Create the message
    const message = await Message.create({
      senderId,
      receiverId,
      content,
      conversationId: conversation.id,
      isRead: false,
      isDeleted: false,
    });

    // Update conversation last message
    await conversation.update({
      lastMessageId: message.id,
      lastMessageAt: message.createdAt,
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`conversation_${conversation.id}`).emit('new_message', {
        message: {
          ...message.toJSON(),
          sender: {
            id: req.user.id,
            fullName: req.user.fullName,
            role: req.user.role,
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message },
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is a participant
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
    });
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied.',
      });
    }

    // Get messages
    const messages = await Message.findAndCountAll({
      where: {
        conversationId: conversation.id,
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'role'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fullName', 'role'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    // Mark messages as read
    await Message.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          conversationId: conversation.id,
          receiverId: userId,
          read: false,
        },
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(),
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(messages.count / limit),
          totalItems: messages.count,
          itemsPerPage: parseInt(limit, 10),
        },
      },
    });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all conversations where the user is a participant
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      order: [['lastMessageAt', 'DESC']],
    });

    // For each conversation, get the latest message and unread count
    const conversationDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Get the latest message
        const lastMessage = await Message.findOne({
          where: {
            conversationId: conv.id,
          },
          order: [['created_at', 'DESC']],
        });

        // Get both participants
        const participant1 = await User.findByPk(conv.participant1Id, {
          attributes: ['id', 'fullName', 'role'],
        });
        const participant2 = await User.findByPk(conv.participant2Id, {
          attributes: ['id', 'fullName', 'role'],
        });
        const participants = [participant1, participant2];

        // Get unread count
        const unreadCount = await Message.count({
          where: {
            conversationId: conv.id,
            receiverId: userId,
            read: false,
          },
        });

        return {
          id: conv.id,
          participants,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        conversations: conversationDetails,
      },
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          conversationId,
          receiverId: userId,
          read: false,
        },
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read.',
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: {
        id,
        senderId: userId,
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not authorized to edit it.',
      });
    }

    // Only allow editing within 5 minutes of sending
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.createdAt < fiveMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: 'Messages can only be edited within 5 minutes of sending.',
      });
    }

    await message.update({
      content,
      isEdited: true,
      editedAt: new Date(),
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`conversation_${message.conversationId}`).emit('message_edited', {
        messageId: message.id,
        content: message.content,
        editedAt: message.editedAt,
      });
    }

    res.json({
      success: true,
      message: 'Message edited successfully.',
      data: {
        message,
      },
    });
  } catch (error) {
    logger.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: {
        id,
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not authorized to delete it',
      });
    }

    // If message has a file attachment, delete it
    if (message.fileUrl) {
      const filePath = path.join(__dirname, '..', message.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await message.update({
      isDeleted: true,
      deletedAt: new Date(),
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`conversation_${message.conversationId}`).emit('message_deleted', {
        messageId: message.id,
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
    });
  }
};

module.exports = {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  deleteMessage,
  editMessage,
};
