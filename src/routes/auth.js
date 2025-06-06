const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { createCustomToken, updateUserClaims } = require('../config/firebase');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Update user role
router.post('/role', authenticate, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'company'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    await updateUserClaims(req.user.uid, { role });
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Verify email
router.post('/verify-email', authenticate, async (req, res, next) => {
  try {
    if (req.user.emailVerified) {
      throw new AppError('Email already verified', 400);
    }

    // Create custom token for email verification
    const customToken = await createCustomToken(req.user.uid, {
      emailVerification: true
    });

    res.json({ customToken });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
