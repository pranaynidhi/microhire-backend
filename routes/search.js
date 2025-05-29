
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const searchController = require('../controllers/searchController');

router.get('/advanced', searchController.advancedSearch);
router.get('/recommendations', auth.verifyToken, searchController.getRecommendations);
router.get('/similar/:id', searchController.getSimilarInternships);
router.get('/suggestions', searchController.getSearchSuggestions);

module.exports = router;
