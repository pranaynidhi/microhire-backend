
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

module.exports = router;
