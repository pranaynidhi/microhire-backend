
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', auth.verifyToken, adminAuth, analyticsController.getOverview);
router.get('/internships', auth.verifyToken, adminAuth, analyticsController.getInternshipAnalytics);
router.get('/applications', auth.verifyToken, adminAuth, analyticsController.getApplicationAnalytics);
router.get('/users', auth.verifyToken, adminAuth, analyticsController.getUserAnalytics);

module.exports = router;
