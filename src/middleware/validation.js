const Joi = require('joi');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Validation schemas
const schemas = {
  // User validation
  user: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        }),
      name: Joi.string().min(2).max(50).required(),
      role: Joi.string().valid('student', 'company').required()
    }),

    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }),

    update: Joi.object({
      name: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      currentPassword: Joi.string().when('password', {
        is: Joi.exist(),
        then: Joi.required()
      }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        })
    })
  },

  // Internship validation
  internship: {
    create: Joi.object({
      title: Joi.string().min(5).max(100).required(),
      description: Joi.string().min(50).max(5000).required(),
      requirements: Joi.array().items(Joi.string()).min(1).required(),
      duration: Joi.number().min(1).max(12).required(),
      stipend: Joi.number().min(0).required(),
      location: Joi.string().required(),
      type: Joi.string().valid('remote', 'onsite', 'hybrid').required(),
      skills: Joi.array().items(Joi.string()).min(1).required(),
      deadline: Joi.date().min('now').required()
    }),

    update: Joi.object({
      title: Joi.string().min(5).max(100),
      description: Joi.string().min(50).max(5000),
      requirements: Joi.array().items(Joi.string()).min(1),
      duration: Joi.number().min(1).max(12),
      stipend: Joi.number().min(0),
      location: Joi.string(),
      type: Joi.string().valid('remote', 'onsite', 'hybrid'),
      skills: Joi.array().items(Joi.string()).min(1),
      deadline: Joi.date().min('now'),
      status: Joi.string().valid('open', 'closed', 'draft')
    })
  },

  // Application validation
  application: {
    create: Joi.object({
      internshipId: Joi.string().required(),
      coverLetter: Joi.string().min(100).max(2000).required(),
      resume: Joi.string().required(),
      portfolio: Joi.string().allow('')
    }),

    update: Joi.object({
      status: Joi.string().valid('pending', 'accepted', 'rejected').required(),
      feedback: Joi.string().max(500).allow('')
    })
  },

  // Review validation
  review: {
    create: Joi.object({
      internshipId: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().min(10).max(500).required()
    }),

    update: Joi.object({
      rating: Joi.number().min(1).max(5),
      comment: Joi.string().min(10).max(500)
    })
  }
};

// Validation middleware
const validate = (schema, property) => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (!error) {
      next();
    } else {
      const errors = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      logger.warn('Validation error:', {
        path: req.path,
        method: req.method,
        errors
      });

      throw new AppError('Validation Error', 400, errors);
    }
  };
};

module.exports = {
  schemas,
  validate
};
