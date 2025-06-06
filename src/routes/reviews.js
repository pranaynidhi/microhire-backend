// routes/reviews.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Existing routes
router.post('/', auth.verifyToken, reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/company/:companyId', reviewController.getCompanyReviews);
router.put('/:id', auth.verifyToken, reviewController.updateReview);
router.delete('/:id', auth.verifyToken, reviewController.deleteReview);
router.get('/stats/:userId', reviewController.getReviewStats);

// New routes for reporting and moderation
router.post('/:reviewId/report', auth.verifyToken, reviewController.reportReview);
router.get('/reports', auth.verifyToken, auth.requireAdmin, reviewController.getReviewReports);
router.patch('/:reviewId/moderate', auth.verifyToken, auth.requireAdmin, reviewController.moderateReview);

module.exports = router;