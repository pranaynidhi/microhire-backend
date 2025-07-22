const { Conversation, User } = require('../../../models');
const { validateEvent } = require('../middleware/validation');
const logger = require('../../../utils/logger');
const Joi = require('joi');

/**
 * Handle joining a conversation room
 */
const handleJoinConversation = async (socket, data) => {
  const { conversationId } = data;
  const userId = socket.user.id;
  
  try {
    // Verify the conversation exists and user is a participant
    const conversation = await Conversation.findByPk(conversationId, {
      include: [{
        model: User,
        as: 'participants',
        attributes: ['id'],
        through: { attributes: [] } // Exclude join table
      }]
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      participant => participant.id === userId
    );
    
    if (!isParticipant) {
      throw new Error('Not authorized to join this conversation');
    }
    
    // Join the room
    await socket.join(`conversation_${conversationId}`);
    
    // Notify others in the conversation
    socket.to(`conversation_${conversationId}`).emit('user_joined_conversation', {
      userId,
      conversationId,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`User ${userId} joined conversation ${conversationId}`);
    
    return {
      success: true,
      conversationId,
      participants: conversation.participants.map(p => p.id)
    };
  } catch (error) {
    logger.error('Error joining conversation room:', {
      error: error.message,
      conversationId,
      userId
    });
    
    throw error;
  }
};

/**
 * Handle leaving a conversation room
 */
const handleLeaveConversation = async (socket, data) => {
  const { conversationId } = data;
  const userId = socket.user.id;
  
  try {
    // Leave the room
    await socket.leave(`conversation_${conversationId}`);
    
    // Notify others in the conversation
    socket.to(`conversation_${conversationId}`).emit('user_left_conversation', {
      userId,
      conversationId,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`User ${userId} left conversation ${conversationId}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Error leaving conversation room:', {
      error: error.message,
      conversationId,
      userId
    });
    
    throw error;
  }
};

// Export wrapped handlers with error handling
module.exports = {
  handleJoinConversation: [
    validateEvent({
      conversationId: Joi.alternatives().try(Joi.string(), Joi.number()).required()
    }, 'join_conversation'),
    handleJoinConversation
  ],
  handleLeaveConversation: [
    validateEvent({
      conversationId: Joi.alternatives().try(Joi.string(), Joi.number()).required()
    }, 'leave_conversation'),
    handleLeaveConversation
  ]
};
