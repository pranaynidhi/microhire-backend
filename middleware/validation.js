const Joi = require('joi');
const { AppError } = require('../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));

      throw new AppError('Validation error', 400, errors);
    }

    next();
  };
};

// Validation schemas
const schemas = {
  internship: {
    create: Joi.object({
      title: Joi.string().required().min(5).max(100),
      description: Joi.string().required().min(50),
      requirements: Joi.string().required(),
      location: Joi.string().required(),
      stipend: Joi.number().min(0),
      duration: Joi.string().required(),
      deadline: Joi.date().min('now').required(),
      type: Joi.string().valid('onsite', 'remote', 'hybrid'),
      category: Joi.string().required(),
      maxApplicants: Joi.number().min(1).max(100)
    }),

    update: Joi.object({
      title: Joi.string().min(5).max(100),
      description: Joi.string().min(50),
      requirements: Joi.string(),
      location: Joi.string(),
      stipend: Joi.number().min(0),
      duration: Joi.string(),
      deadline: Joi.date().min('now'),
      type: Joi.string().valid('onsite', 'remote', 'hybrid'),
      category: Joi.string(),
      maxApplicants: Joi.number().min(1).max(100),
      status: Joi.string().valid('active', 'closed', 'completed')
    })
  },

  application: {
    create: Joi.object({
      internshipId: Joi.number().required(),
      coverLetter: Joi.string().required().min(100)
    }),

    update: Joi.object({
      status: Joi.string().valid('pending', 'accepted', 'rejected').required()
    })
  },

  review: {
    create: Joi.object({
      internshipId: Joi.number().required(),
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().required().min(10)
    })
  }
};

module.exports = {
  validate,
  schemas
};
