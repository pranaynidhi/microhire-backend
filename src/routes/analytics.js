const express = require('express');
const router = express.Router();
const { authenticate, isCompany, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const analyticsController = require('../controllers/analyticsController');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and statistics
 */

/**
 * @swagger
 * /api/analytics/user:
 *   get:
 *     summary: Get user analytics
 *     description: Retrieve analytics data for the current user
 *     tags: [Analytics]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: User analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// router.get('/', authenticate, ...);

// Get user analytics
router.get('/user', authenticate, requireEmailVerification, analyticsController.getUserAnalytics);

// Get company analytics (company only)
router.get('/company', authenticate, isCompany, requireEmailVerification, analyticsController.getCompanyAnalytics);

// Get platform analytics (admin only)
router.get('/platform', authenticate, requireEmailVerification, analyticsController.getPlatformAnalytics);

module.exports = router;
