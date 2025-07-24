// routes/reviews.js
const express = require('express');

const router = express.Router();
const {
  authenticate,
  isStudent,
  requireEmailVerification,
  requireAdmin,
} = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Reviews and moderation
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review (student only)
 *     description: Submit a new review for a user or company (only available to students)
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewedId
 *               - rating
 *               - comment
 *               - type
 *             properties:
 *               reviewedId:
 *                 type: integer
 *                 description: ID of the user or company being reviewed
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating (1-5)
 *               comment:
 *                 type: string
 *                 description: Review comment
 *               type:
 *                 type: string
 *                 enum: [student, company]
 *                 description: Type of review
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only students can create reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, isStudent, requireEmailVerification, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get reviews for a user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/user/:userId', reviewController.getUserReviews);

/**
 * @swagger
 * /api/reviews/company/{companyId}:
 *   get:
 *     summary: Get reviews for a company
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/company/:companyId', reviewController.getCompanyReviews);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review (student only)
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Review updated
 */
router.put(
  '/:id',
  authenticate,
  isStudent,
  requireEmailVerification,
  reviewController.updateReview
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (student only)
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete(
  '/:id',
  authenticate,
  isStudent,
  requireEmailVerification,
  reviewController.deleteReview
);

/**
 * @swagger
 * /api/reviews/stats/{userId}:
 *   get:
 *     summary: Get review stats for a user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review stats
 */
router.get('/stats/:userId', reviewController.getReviewStats);

/**
 * @swagger
 * /api/reviews/{reviewId}/report:
 *   post:
 *     summary: Report a review
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review reported
 */
router.post(
  '/:reviewId/report',
  authenticate,
  requireEmailVerification,
  reviewController.reportReview
);

/**
 * @swagger
 * /api/reviews/reports:
 *   get:
 *     summary: Get all review reports (admin only)
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of review reports
 */
router.get('/reports', authenticate, requireAdmin, reviewController.getReviewReports);

/**
 * @swagger
 * /api/reviews/{reviewId}/moderate:
 *   patch:
 *     summary: Moderate a review (admin only)
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Review moderated
 */
router.patch('/:reviewId/moderate', authenticate, requireAdmin, reviewController.moderateReview);

// Get all reviews
router.get('/', authenticate, requireEmailVerification, reviewController.getAllReviews);

// Get review by ID
router.get('/:id', authenticate, requireEmailVerification, reviewController.getReviewById);

// Report review
router.post(
  '/:reviewId/report',
  authenticate,
  requireEmailVerification,
  reviewController.reportReview
);


module.exports = router;
