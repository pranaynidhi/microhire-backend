const TwoFactorService = require('../services/twoFactorService');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const jwt = require('jsonwebtoken');

class TwoFactorController {
  /**
   * Generate 2FA setup data for a user
   */
  static async setup2FA(req, res, next) {
    try {
      const { user } = req;
      
      if (user.twoFactorEnabled) {
        return next(new AppError('2FA is already enabled', 400));
      }

      // Generate new 2FA secret
      const { secret, qrCodeUrl } = await TwoFactorService.generateSecret(user);
      
      // Save the secret (not yet enabled)
      await user.update({ twoFactorSecret: secret });

      res.json({
        success: true,
        data: {
          qrCodeUrl,
          secret // Only for development, remove in production
        }
      });
    } catch (error) {
      logger.error('2FA setup error:', error);
      next(error);
    }
  }

  /**
   * Verify 2FA setup and enable it for the user
   */
  static async verify2FA(req, res, next) {
    try {
      const { user } = req;
      const { token } = req.body;

      if (!token) {
        return next(new AppError('Verification token is required', 400));
      }

      const result = await TwoFactorService.enable2FA(user, token);
      
      if (!result) {
        return next(new AppError('Invalid verification code', 400));
      }

      res.json({
        success: true,
        message: '2FA enabled successfully',
        data: {
          recoveryCodes: result.recoveryCodes
        }
      });
    } catch (error) {
      logger.error('2FA verification error:', error);
      next(error);
    }
  }

  /**
   * Disable 2FA for the current user
   */
  static async disable2FA(req, res, next) {
    try {
      const { user } = req;
      
      if (!user.twoFactorEnabled) {
        return next(new AppError('2FA is not enabled', 400));
      }

      await TwoFactorService.disable2FA(user);
      
      res.json({
        success: true,
        message: '2FA disabled successfully'
      });
    } catch (error) {
      logger.error('2FA disable error:', error);
      next(error);
    }
  }

  /**
   * Verify 2FA token (for login)
   */
  static async verifyToken(req, res, next) {
    try {
      const { token, email } = req.body;

      if (!token || !email) {
        return next(new AppError('Verification token and email are required', 400));
      }

      // Fetch the user by email
      const { User } = require('../models');
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Debug log
      console.log('DEBUG 2FA: user.twoFactorSecret =', user.twoFactorSecret);
      console.log('DEBUG 2FA: submitted token =', token);

      const isValid = TwoFactorService.verifyToken(user, token);

      if (isValid) {
        console.log('DEBUG 2FA: Verification succeeded, sending tokens');
        const { accessToken, refreshToken } = generateTokens(user.id);
        return res.json({
          success: true,
          message: '2FA verification successful',
          data: {
            accessToken,
            refreshToken
          }
        });
      }
      return next(new AppError('Invalid verification code', 400));
    } catch (error) {
      logger.error('2FA token verification error:', error);
      next(error);
    }
  }

  /**
   * Generate new recovery codes
   */
  static async generateRecoveryCodes(req, res, next) {
    try {
      const { user } = req;
      
      if (!user.twoFactorEnabled) {
        return next(new AppError('2FA is not enabled', 400));
      }

      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      await user.update({ twoFARecoveryCodes: recoveryCodes });
      
      res.json({
        success: true,
        data: { recoveryCodes }
      });
    } catch (error) {
      logger.error('Error generating recovery codes:', error);
      next(error);
    }
  }

  /**
   * Verify recovery code (for 2FA bypass during login)
   */
  static async verifyRecoveryCodeLogin(req, res, next) {
    try {
      const { code, email } = req.body;

      if (!code || !email) {
        return next(new AppError('Recovery code and email are required', 400));
      }

      // Fetch the user by email
      const { User } = require('../models');
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      if (!user.twoFactorEnabled) {
        return next(new AppError('2FA is not enabled for this user', 400));
      }

      const isValid = await TwoFactorService.verifyRecoveryCode(user, code);
      
      if (!isValid) {
        return next(new AppError('Invalid recovery code', 400));
      }

      // Generate new tokens since recovery was successful
      const { accessToken, refreshToken } = generateTokens(user.id);
      
      res.json({
        success: true,
        message: 'Recovery successful',
        data: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Recovery code verification error:', error);
      next(error);
    }
  }

  /**
   * Verify recovery code (for authenticated users)
   */
  static async verifyRecoveryCode(req, res, next) {
    try {
      const { code } = req.body;
      const { user } = req;

      if (!code) {
        return next(new AppError('Recovery code is required', 400));
      }

      const isValid = await TwoFactorService.verifyRecoveryCode(user, code);
      
      if (!isValid) {
        return next(new AppError('Invalid recovery code', 400));
      }

      // Generate new tokens since recovery was successful
      const { accessToken, refreshToken } = generateTokens(user.id);
      
      res.json({
        success: true,
        message: 'Recovery successful',
        data: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Recovery code verification error:', error);
      next(error);
    }
  }
}

// Helper function to generate tokens (duplicated from authController)
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
}

module.exports = TwoFactorController;
