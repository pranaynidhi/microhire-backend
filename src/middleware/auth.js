const { verifyIdToken } = require('../config/firebase');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Middleware to verify Firebase ID token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      role: decodedToken.role || 'user'
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(new AppError('Invalid or expired token', 401));
  }
};

// Middleware to check if user is a company
const isCompany = (req, res, next) => {
  if (req.user.role !== 'company') {
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

module.exports = {
  authenticate,
  isCompany,
  isStudent,
  requireEmailVerification
};
