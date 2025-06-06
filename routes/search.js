const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const searchController = require('../controllers/searchController');

router.get('/advanced', searchController.advancedSearch);
router.get('/recommendations', auth.verifyToken, searchController.getRecommendations);
router.get('/similar/:id', searchController.getSimilarInternships);
router.get('/suggestions', searchController.getSearchSuggestions);
router.post('/history/:id/save', auth.verifyToken, searchController.saveSearch);
router.get('/history', auth.verifyToken, searchController.getSearchHistory);
router.get('/saved', auth.verifyToken, searchController.getSavedSearches);
router.post('/track-click', auth.verifyToken, searchController.trackSearchClick);

module.exports = router;
