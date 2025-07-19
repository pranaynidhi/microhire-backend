const TwoFactorService = require('../services/twoFactorService');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class TwoFactorController {
  /**
   * Generate 2FA setup data for a user
   */
  static async setup2FA(req, res, next) {
    try {
      const { user } = req;
      
      if (user.twoFAEnabled) {
        return next(new AppError('2FA is already enabled', 400));
      }

      // Generate new 2FA secret
      const { secret, qrCodeUrl } = await TwoFactorService.generateSecret(user);
      
      // Save the secret (not yet enabled)
      await user.update({ twoFASecret: secret });

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
      
      if (!user.twoFAEnabled) {
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
      const { token } = req.body;
      const { user } = req;

      if (!token) {
        return next(new AppError('Verification token is required', 400));
      }

      const isValid = TwoFactorService.verifyToken(user, token);
      
      if (!isValid) {
        return next(new AppError('Invalid verification code', 400));
      }

      // Generate new tokens since 2FA was successful
      const { accessToken, refreshToken } = generateTokens(user.id);
      
      res.json({
        success: true,
        message: '2FA verification successful',
        data: {
          accessToken,
          refreshToken
        }
      });
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
      
      if (!user.twoFAEnabled) {
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
   * Verify recovery code (for 2FA bypass)
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
          refreshToken,
          recoveryCodes: user.twoFARecoveryCodes // Return remaining codes
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
