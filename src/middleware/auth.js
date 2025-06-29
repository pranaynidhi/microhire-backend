const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// JWT-based authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user object from database
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error instanceof Error ? error.stack : JSON.stringify(error));
    next(new AppError('Invalid or expired token', 401));
  }
};

// Middleware to check if user is a company
const isCompany = (req, res, next) => {
  if (req.user.role !== 'business' && req.user.role !== 'admin') {
    return next(new AppError('Access denied. Company role required', 403));
  }
  next();
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Access denied. Student role required', 403));
  }
  next();
};

// Middleware to check if email is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return next(new AppError('Email verification required', 403));
  }
  next();
};

// Middleware to check if user is an admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admin role required', 403));
  }
  next();
};

module.exports = {
  authenticate,
  isCompany,
  isStudent,
  requireEmailVerification,
  requireAdmin
};
