const Joi = require('joi');
const { AppError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * Validates the payload of a Socket.IO event against a Joi schema
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {string} eventName - Name of the event being validated (for logging)
 */
const validateEvent = (schema, eventName) => {
  return (data, callback) => {
    try {
      // If callback is provided, it's a socket.io middleware
      const isMiddleware = typeof callback === 'function';
      const payload = isMiddleware ? data : data[1];
      
      // Validate against schema
      const { error, value } = schema.validate(payload, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        logger.warn(`Validation failed for event '${eventName}':`, {
          error: error.message,
          payload
        });
        
        const validationError = new AppError(
          `Invalid ${eventName} payload: ${error.details.map(d => d.message).join('; ')}`,
          400
        );
        
        if (isMiddleware) {
          // For middleware, pass error to next()
          return callback(validationError);
        } else {
          // For handlers, emit error event
          this.emit('error', {
            code: 'VALIDATION_ERROR',
            message: validationError.message,
            details: error.details,
            event: eventName
          });
          return null;
        }
      }

      // Replace payload with validated and cleaned data
      if (isMiddleware) {
        data = value;
        return callback(null, true);
      } else {
        data[1] = value;
        return data;
      }
    } catch (error) {
      logger.error(`Error validating event '${eventName}':`, error);
      
      if (isMiddleware) {
        return callback(error);
      } else {
        this.emit('error', {
          code: 'VALIDATION_ERROR',
          message: 'An error occurred during validation',
          event: eventName
        });
        return null;
      }
    }
  };
};

// Common validation schemas
const schemas = {
  message: Joi.object({
    recipientId: Joi.alternatives().try(
      Joi.string().required(),
      Joi.number().required()
    ),
    message: Joi.string().trim().min(1).max(2000).required(),
    conversationId: Joi.alternatives().try(
      Joi.string(),
      Joi.number()
    ),
    attachments: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        type: Joi.string().valid('image', 'document', 'other').required(),
        name: Joi.string(),
        size: Joi.number().positive()
      })
    ).max(10)
  }),
  
  notificationRead: Joi.object({
    notificationId: Joi.alternatives().try(
      Joi.string().required(),
      Joi.number().required()
    )
  }),
  
  roomAction: Joi.object({
    roomId: Joi.alternatives().try(
      Joi.string().required(),
      Joi.number().required()
    )
  })
};

module.exports = {
  validateEvent,
  schemas
};
