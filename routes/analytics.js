
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', auth, adminAuth, analyticsController.getOverview);
router.get('/internships', auth, adminAuth, analyticsController.getInternshipAnalytics);
router.get('/applications', auth, adminAuth, analyticsController.getApplicationAnalytics);
router.get('/users', auth, adminAuth, analyticsController.getUserAnalytics);

module.exports = router;
