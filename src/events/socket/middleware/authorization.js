const { AppError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * Middleware to check if user has required roles
 * @param {string[]} allowedRoles - Array of allowed role names
 */
const requireRoles = (allowedRoles = []) => {
  return (socket, next) => {
    try {
      if (!socket.user) {
        throw new AppError('Authentication required', 401);
      }

      // If no roles are specified, just verify authentication
      if (allowedRoles.length === 0) {
        return next();
      }

      // Check if user has one of the allowed roles
      if (!allowedRoles.includes(socket.user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has permission to access a resource
 * @param {string} resourceType - Type of resource (e.g., 'conversation', 'notification')
 * @param {function} checkPermission - Async function that checks if user has permission
 */
const requireResourceAccess = (resourceType, checkPermission) => {
  return async (socket, data, next) => {
    try {
      if (!socket.user) {
        throw new AppError('Authentication required', 401);
      }

      // Get resource ID from data based on resource type
      let resourceId;
      switch (resourceType) {
        case 'conversation':
          resourceId = data.conversationId || data.roomId;
          break;
        case 'notification':
          resourceId = data.notificationId;
          break;
        case 'message':
          resourceId = data.messageId;
          break;
        default:
          resourceId = data.id || data[`${resourceType}Id`];
      }

      if (!resourceId) {
        throw new AppError(`${resourceType} ID is required`, 400);
      }

      // Check permission using the provided function
      const hasAccess = await checkPermission(socket.user.id, resourceId, data);
      
      if (!hasAccess) {
        throw new AppError(`Access to ${resourceType} denied`, 403);
      }

      // Store the resource ID for use in subsequent handlers
      socket.resource = {
        id: resourceId,
        type: resourceType
      };

      next();
    } catch (error) {
      logger.error('Resource access check failed:', {
        error: error.message,
        resourceType,
        userId: socket.user?.id,
        resourceId: data?.id || data?.conversationId || data?.notificationId || 'unknown'
      });
      next(error);
    }
  };
};

/**
 * Middleware to check if the user is the owner of a resource
 * @param {string} resourceType - Type of resource (e.g., 'message', 'notification')
 * @param {object} models - Sequelize models
 * @param {string} [ownerField='userId'] - Field that contains the owner ID in the resource
 */
const requireOwnership = (resourceType, models, ownerField = 'userId') => {
  return async (socket, data, next) => {
    try {
      if (!socket.user) {
        throw new AppError('Authentication required', 401);
      }

      const Model = models[resourceType];
      if (!Model) {
        throw new Error(`Invalid resource type: ${resourceType}`);
      }

      const resourceId = data.id || data[`${resourceType}Id`];
      if (!resourceId) {
        throw new AppError(`${resourceType} ID is required`, 400);
      }

      // Find the resource
      const resource = await Model.findByPk(resourceId);
      if (!resource) {
        throw new AppError(`${resourceType} not found`, 404);
      }

      // Check if the current user is the owner
      if (resource[ownerField] !== socket.user.id) {
        throw new AppError(`You are not the owner of this ${resourceType}`, 403);
      }

      // Attach the resource to the socket for use in subsequent handlers
      socket.resource = {
        ...socket.resource,
        instance: resource,
        isOwner: true
      };

      next();
    } catch (error) {
      logger.error('Ownership check failed:', {
        error: error.message,
        resourceType,
        userId: socket.user?.id,
        resourceId: data?.id || 'unknown'
      });
      next(error);
    }
  };
};

/**
 * Middleware to check if the user is a participant in a conversation
 */
const requireConversationParticipation = (models) => {
  return async (socket, data, next) => {
    try {
      if (!socket.user) {
        throw new AppError('Authentication required', 401);
      }

      const conversationId = data.conversationId || data.roomId;
      if (!conversationId) {
        throw new AppError('Conversation ID is required', 400);
      }

      // Check if conversation exists and user is a participant
      const conversation = await models.Conversation.findByPk(conversationId, {
        include: [{
          model: models.User,
          as: 'participants',
          attributes: ['id'],
          through: { attributes: [] } // Exclude join table
        }]
      });

      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      const isParticipant = conversation.participants.some(
        user => user.id === socket.user.id
      );

      if (!isParticipant) {
        throw new AppError('You are not a participant in this conversation', 403);
      }

      // Attach conversation to the socket for use in subsequent handlers
      socket.conversation = conversation;

      next();
    } catch (error) {
      logger.error('Conversation participation check failed:', {
        error: error.message,
        userId: socket.user?.id,
        conversationId: data?.conversationId || data?.roomId || 'unknown'
      });
      next(error);
    }
  };
};

module.exports = {
  requireRoles,
  requireResourceAccess,
  requireOwnership,
  requireConversationParticipation
};
