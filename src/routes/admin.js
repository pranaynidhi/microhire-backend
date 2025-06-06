const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

router.get('/users', auth.verifyToken, adminAuth, adminController.getUsers);
router.patch('/users/:id/status', auth.verifyToken, adminAuth, adminController.updateUserStatus);
router.get('/internships', auth.verifyToken, adminAuth, adminController.getInternships);
router.patch('/internships/:id/moderate', auth.verifyToken, adminAuth, adminController.moderateInternship);
router.get('/reports', auth.verifyToken, adminAuth, adminController.getReports);
router.post('/reports/:id/resolve', auth.verifyToken, adminAuth, adminController.resolveReport);
router.get('/dashboard', auth.verifyToken, adminAuth, adminController.getDashboardOverview);
router.get('/settings', auth.verifyToken, adminAuth, adminController.getSystemSettings);
router.put('/settings', auth.verifyToken, adminAuth, adminController.updateSystemSettings);

module.exports = router;
