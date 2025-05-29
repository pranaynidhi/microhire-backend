// routes/reviews.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

router.post('/', auth, reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/company/:companyId', reviewController.getCompanyReviews);
router.put('/:id', auth, reviewController.updateReview);
router.delete('/:id', auth, reviewController.deleteReview);
router.get('/stats/:userId', reviewController.getReviewStats);

module.exports = router;
