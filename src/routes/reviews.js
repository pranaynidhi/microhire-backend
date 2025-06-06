// routes/reviews.js
const express = require('express');
const router = express.Router();
const { authenticate, isStudent, isCompany, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const reviewController = require('../controllers/reviewController');

// Existing routes
router.post('/', authenticate, isStudent, requireEmailVerification, reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/company/:companyId', reviewController.getCompanyReviews);
router.put('/:id', authenticate, isStudent, requireEmailVerification, reviewController.updateReview);
router.delete('/:id', authenticate, isStudent, requireEmailVerification, reviewController.deleteReview);
router.get('/stats/:userId', reviewController.getReviewStats);

// New routes for reporting and moderation
router.post('/:reviewId/report', authenticate, requireEmailVerification, reviewController.reportReview);
router.get('/reports', authenticate, auth.requireAdmin, reviewController.getReviewReports);
router.patch('/:reviewId/moderate', authenticate, auth.requireAdmin, reviewController.moderateReview);

// Get all reviews
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Implementation here
    res.json({ message: 'Get all reviews' });
  } catch (error) {
    next(error);
  }
});

// Get review by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Implementation here
    res.json({ message: `Get review ${id}` });
  } catch (error) {
    next(error);
  }
});

// Update review (student only)
router.put('/:id', authenticate, isStudent, requireEmailVerification, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Implementation here
    res.json({ message: `Update review ${id}` });
  } catch (error) {
    next(error);
  }
});

// Delete review (student only)
router.delete('/:id', authenticate, isStudent, requireEmailVerification, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Implementation here
    res.json({ message: `Delete review ${id}` });
  } catch (error) {
    next(error);
  }
});

// Report review
router.post('/:id/report', authenticate, requireEmailVerification, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    // Implementation here
    res.json({ message: `Report review ${id}` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;