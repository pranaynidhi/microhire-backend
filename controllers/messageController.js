const { Message, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    // Validate receiver
    const receiver = await User.findOne({
      where: { id: receiverId, isActive: true }
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Generate conversation ID
    const conversationId = Message.generateConversationId(senderId, receiverId);

    // Handle file attachment if present
    let fileUrl = null;
    let fileName = null;
    let messageType = 'text';

    if (req.file) {
      fileUrl = `/uploads/messages/${req.file.filename}`;
      fileName = req.file.originalname;
      messageType = 'file';
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content,
      conversationId,
      messageType,
      fileUrl,
      fileName
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`conversation_${conversationId}`).emit('new_message', {
        message: {
          ...message.toJSON(),
          sender: {
            id: req.user.id,
            fullName: req.user.fullName,
            role: req.user.role
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;
    const conversationId = Message.generateConversationId(currentUserId, parseInt(userId));

    const messages = await Message.findAndCountAll({
      where: {
        conversationId,
        isDeleted: false,
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
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Mark messages as read
    await Message.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          conversationId,
          receiverId: currentUserId,
          isRead: false,
        },
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(), // Reverse to show oldest first
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(messages.count / limit),
          totalItems: messages.count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unique conversations for the user
    const conversations = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
        isDeleted: false,
      },
      attributes: [
        'conversationId',
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastMessageAt'],
      ],
      group: ['conversationId'],
      order: [[sequelize.fn('MAX', sequelize.col('createdAt')), 'DESC']],
    });

    // Get detailed conversation info
    const conversationDetails = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          where: {
            conversationId: conv.conversationId,
            isDeleted: false,
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
          order: [['createdAt', 'DESC']],
        });

        const otherUser = lastMessage.senderId === userId 
          ? lastMessage.receiver 
          : lastMessage.sender;

        const unreadCount = await Message.count({
          where: {
            conversationId: conv.conversationId,
            receiverId: userId,
            isRead: false,
            isDeleted: false,
          },
        });

        return {
          conversationId: conv.conversationId,
          otherUser,
          lastMessage: {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
          },
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
    console.error('Get conversations error:', error);
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
          isRead: false,
        },
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read.',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
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
        isDeleted: false,
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
    console.error('Edit message error:', error);
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
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
        isDeleted: false
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not authorized to delete it'
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
      deletedAt: new Date()
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`conversation_${message.conversationId}`).emit('message_deleted', {
        messageId: message.id
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  editMessage,
  deleteMessage,
};
