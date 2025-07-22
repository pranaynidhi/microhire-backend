const { Message, User, Conversation } = require('../../../models');
const { socketErrorHandler } = require('../middleware/errorHandler');
const { validateEvent, schemas } = require('../middleware/validation');
const logger = require('../../../utils/logger');
const Joi = require('joi');

/**
 * Handle sending a new message
 */
const handleSendMessage = async (socket, data) => {
  const { recipientId, message, conversationId, attachments = [] } = data;
  const senderId = socket.user.id;
  
  try {
    // Create or find conversation
    let conversation;
    if (conversationId) {
      // Add to existing conversation
      conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      // Verify user is part of the conversation
      const isParticipant = await conversation.hasParticipant(senderId);
      if (!isParticipant) {
        throw new Error('Not authorized to send message to this conversation');
      }
    } else {
      // Create new conversation if it doesn't exist
      conversation = await Conversation.create({
        type: 'direct',
        createdBy: senderId
      });
      
      // Add participants to conversation
      await conversation.addParticipants([senderId, recipientId]);
    }
    
    // Create message in database
    const messageRecord = await Message.create({
      conversationId: conversation.id,
      senderId,
      content: message,
      status: 'sent',
      metadata: { attachments }
    });
    
    // Get sender details
    const sender = await User.findByPk(senderId, {
      attributes: ['id', 'fullName', 'avatar']
    });
    
    // Prepare message data for clients
    const messageData = {
      id: messageRecord.id,
      conversationId: conversation.id,
      senderId,
      sender: {
        id: sender.id,
        fullName: sender.fullName,
        avatar: sender.avatar
      },
      content: message,
      status: 'sent',
      attachments,
      createdAt: messageRecord.createdAt,
      updatedAt: messageRecord.updatedAt
    };
    
    // Emit to recipient
    socket.to(`user_${recipientId}`).emit('receive_message', messageData);
    
    // Emit back to sender as confirmation
    socket.emit('message_sent', {
      ...messageData,
      status: 'delivered'
    });
    
    // Update message status to delivered
    await messageRecord.update({ status: 'delivered' });
    
    logger.info(`Message sent from ${senderId} to ${recipientId}`, {
      conversationId: conversation.id,
      messageId: messageRecord.id
    });
    
    return {
      success: true,
      message: 'Message sent successfully',
      data: messageData
    };
  } catch (error) {
    logger.error('Error sending message:', {
      error: error.message,
      stack: error.stack,
      senderId,
      recipientId,
      conversationId
    });
    
    // Notify sender of the error
    socket.emit('message_error', {
      code: 'MESSAGE_SEND_FAILED',
      message: 'Failed to send message',
      details: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};

/**
 * Handle message read receipt
 */
const handleMessageRead = async (socket, data) => {
  const { messageId, conversationId } = data;
  const userId = socket.user.id;
  
  try {
    // Update message status to read
    const [updated] = await Message.update(
      { status: 'read' },
      {
        where: {
          id: messageId,
          conversationId,
          status: { [Op.ne]: 'read' } // Only update if not already read
        },
        returning: true
      }
    );
    
    if (updated > 0) {
      // Notify sender that message was read
      socket.to(`conversation_${conversationId}`).emit('message_read', {
        messageId,
        conversationId,
        readBy: userId,
        readAt: new Date().toISOString()
      });
      
      logger.info(`Message ${messageId} marked as read by ${userId}`);
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error marking message as read:', {
      error: error.message,
      messageId,
      userId
    });
    
    throw error;
  }
};

/**
 * Handle typing indicator
 */
const handleTyping = (socket, data) => {
  const { conversationId, isTyping } = data;
  const userId = socket.user.id;
  
  // Broadcast typing status to conversation participants
  socket.to(`conversation_${conversationId}`).emit('user_typing', {
    userId,
    conversationId,
    isTyping,
    timestamp: new Date().toISOString()
  });
};

// Export wrapped handlers with error handling
module.exports = {
  handleSendMessage: [
    validateEvent(schemas.message, 'send_message'),
    handleSendMessage
  ],
  handleMessageRead: [
    validateEvent({
      messageId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      conversationId: Joi.alternatives().try(Joi.string(), Joi.number()).required()
    }, 'message_read'),
    handleMessageRead
  ],
  handleTyping: [
    validateEvent({
      conversationId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      isTyping: Joi.boolean().required()
    }, 'typing'),
    handleTyping
  ]
};
