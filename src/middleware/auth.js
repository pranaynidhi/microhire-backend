const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const TwoFactorService = require('../services/twoFactorService');
const { isTokenBlacklisted } = require('../services/tokenService');

// JWT-based authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    const token = authHeader.split('Bearer ')[1];
    
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      logger.warn('Attempt to use blacklisted token', { token: token.substring(0, 10) + '...' });
      throw new AppError('This token has been invalidated', 401);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user object from database
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Check if 2FA is required but not verified
    if (user.twoFAEnabled && !decoded.twoFASuccess) {
      return res.status(401).json({
        success: false,
        code: '2FA_REQUIRED',
        message: 'Two-factor authentication required',
        data: {
          twoFARequired: true,
          email: user.email
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(
      'Authentication error:',
      error instanceof Error ? error.stack : JSON.stringify(error)
    );
    
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired', 401));
    }
    
    next(new AppError('Invalid or expired token', 401));
  }
};

// Middleware to check if 2FA is enabled but not verified
const check2FA = async (req, res, next) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ where: { email } });
    
    if (user && user.twoFAEnabled) {
      // Generate a temporary token that only allows 2FA verification
      const tempToken = jwt.sign(
        { 
          userId: user.id,
          twoFAPending: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' } // Short expiration for 2FA verification
      );
      
      return res.status(200).json({
        success: true,
        data: {
          twoFARequired: true,
          tempToken,
          email: user.email
        }
      });
    }
    
    next();
  } catch (error) {
    logger.error('2FA check error:', error);
    next(error);
  }
};

// Middleware to check if user is a company
const isCompany = (req, res, next) => {
  if (req.user.role !== 'business' && req.user.role !== 'admin') {
    return next(new AppError('Access denied. Company role required', 403));
  }
  next();
  return null;
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Access denied. Student role required', 403));
  }
  next();
  return null;
};

// Middleware to check if email is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return next(new AppError('Email verification required', 403));
  }
  next();
  return null;
};

// Middleware to check if user is an admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admin role required', 403));
  }
  next();
  return null;
};

module.exports = {
  authenticate,
  check2FA,
  isCompany,
  isStudent,
  requireEmailVerification,
  requireAdmin,
};
