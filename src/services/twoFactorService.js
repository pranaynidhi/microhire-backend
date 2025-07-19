const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { User } = require('../models');
const logger = require('../utils/logger');

class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Returns secret and QR code
   */
  static async generateSecret(user, issuer = 'MicroHire') {
    try {
      const secret = speakeasy.generateSecret({
        length: 20,
        name: `${issuer}:${user.email}`,
        issuer
      });

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      return {
        secret: secret.base32,
        qrCodeUrl,
        otpauthUrl: secret.otpauth_url
      };
    } catch (error) {
      logger.error('Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Verify a 2FA token
   * @param {Object} user - User object
   * @param {string} token - 2FA token to verify
   * @returns {boolean} - Returns true if token is valid
   */
  static verifyToken(user, token) {
    if (!user.twoFASecret) {
      throw new Error('2FA not set up for this user');
    }

    return speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step (30s) before/after current time
    });
  }

  /**
   * Enable 2FA for a user
   * @param {string} userId - User ID
   * @param {string} token - 2FA token to verify
   * @returns {Promise<boolean>} - Returns true if successful
   */
  static async enable2FA(user, token) {
    try {
      const isValid = this.verifyToken(user, token);
      if (!isValid) {
        return false;
      }

      await user.update({ 
        twoFAEnabled: true,
        twoFASecret: user.twoFASecret // Save the secret that was generated earlier
      });

      // Generate recovery codes
      const recoveryCodes = this.generateRecoveryCodes();
      await user.update({ twoFARecoveryCodes: recoveryCodes });

      return {
        success: true,
        recoveryCodes
      };
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Disable 2FA for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Returns true if successful
   */
  static async disable2FA(user) {
    try {
      await user.update({
        twoFAEnabled: false,
        twoFASecret: null,
        twoFARecoveryCodes: null
      });
      return true;
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Generate recovery codes for 2FA
   * @returns {string[]} - Array of recovery codes
   */
  static generateRecoveryCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Verify a recovery code
   * @param {Object} user - User object
   * @param {string} code - Recovery code to verify
   * @returns {Promise<boolean>} - Returns true if code is valid
   */
  static async verifyRecoveryCode(user, code) {
    try {
      if (!user.twoFARecoveryCodes || !user.twoFARecoveryCodes.length) {
        return false;
      }

      const index = user.twoFARecoveryCodes.indexOf(code);
      if (index === -1) {
        return false;
      }

      // Remove the used recovery code
      const updatedCodes = [...user.twoFARecoveryCodes];
      updatedCodes.splice(index, 1);
      
      await user.update({ twoFARecoveryCodes: updatedCodes });
      return true;
    } catch (error) {
      logger.error('Error verifying recovery code:', error);
      return false;
    }
  }
}

module.exports = TwoFactorService;
