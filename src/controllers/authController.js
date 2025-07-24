const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const {User} = require('../models');
const emailService = require('../services/emailService');
const sessionUtil = require('../utils/session');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      bio,
      skills,
      companyName,
      contactPerson,
      companyDescription,
      website,
      phone,
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userData = {
      fullName,
      email,
      password,
      role,
      emailVerificationToken,
      emailVerificationExpires,
    };

    if (role === 'student') {
      userData.bio = bio;
      userData.skills = skills;
    } else if (role === 'business') {
      userData.companyName = companyName;
      userData.contactPerson = contactPerson;
      userData.companyDescription = companyDescription;
      userData.website = website;
      userData.phone = phone;
    }

    const user = await User.create(userData);

    // Send verification email
    await emailService.sendVerificationEmail(user.email, emailVerificationToken);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error(error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.method === 'GET' ? req.query : req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }
    const user = await User.findOne({ where: { emailVerificationToken: token } });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired verification token' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    // Optionally check token expiry if you store expiry
    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message:
          'Please verify your email address before logging in. Check your inbox for a verification link.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate a temporary token that only allows 2FA verification
      const tempToken = jwt.sign(
        { 
          userId: user.id,
          twoFAPending: true,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' } // Short expiration for 2FA verification
      );

      return res.status(200).json({
        success: true,
        message: '2FA verification required',
        data: {
          twoFARequired: true,
          tempToken,
          email: user.email
        }
      });
    }

    // If 2FA is not enabled, generate regular tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    // Create session in Redis
    const device = req.headers['x-device'] || 'Unknown';
    const ip = req.ip || req.connection?.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const sessionId = await sessionUtil.createSession({
      userId: user.id,
      device,
      ip,
      userAgent,
      refreshToken,
    });
    // Update last login time
    await user.update({ lastLogin: new Date() });
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken,
        sessionId,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, emailVerificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    });
  } catch (error) {
    logger.error('Resend verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  refreshToken,
  login,
  resendVerificationEmail,
  generateTokens,
};
