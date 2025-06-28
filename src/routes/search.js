const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const searchController = require('../controllers/searchController');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search functionality
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search internships, users, or companies
 *     tags: [Search]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
// router.get('/', authenticate, ...);

// Search internships
router.get('/internships', authenticate, requireEmailVerification, searchController.searchInternships);

// Search companies
router.get('/companies', authenticate, requireEmailVerification, searchController.searchCompanies);

// Search students
router.get('/students', authenticate, requireEmailVerification, searchController.searchStudents);

router.get('/advanced', searchController.advancedSearch);
router.get('/recommendations', authenticate, searchController.getRecommendations);
router.get('/similar/:id', searchController.getSimilarInternships);
router.get('/suggestions', searchController.getSearchSuggestions);
router.post('/history/:id/save', authenticate, searchController.saveSearch);
router.get('/history', authenticate, searchController.getSearchHistory);
router.get('/saved', authenticate, searchController.getSavedSearches);
router.post('/track-click', authenticate, searchController.trackSearchClick);

module.exports = router;
