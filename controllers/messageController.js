const { Message, User } = require('../models');
const { Op } = require('sequelize');

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;
    const senderId = req.user.id;

    // Validate receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found.',
      });
    }

    // Generate conversation ID
    const conversationId = Message.generateConversationId(senderId, receiverId);

    // Create message
    const message = await Message.create({
      senderId,
      receiverId,
      content,
      messageType,
      conversationId,
    });

    await message.reload({
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
    });

    // Emit real-time event (will be implemented with Socket.io)
    if (req.io) {
      req.io.to(`user_${receiverId}`).emit('new_message', {
        message,
        conversationId,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: {
        message,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
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

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
};
