
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

router.get('/users', auth, adminAuth, adminController.getUsers);
router.patch('/users/:id/status', auth, adminAuth, adminController.updateUserStatus);
router.get('/internships', auth, adminAuth, adminController.getInternships);
router.patch('/internships/:id/moderate', auth, adminAuth, adminController.moderateInternship);
router.get('/reports', auth, adminAuth, adminController.getReports);
router.post('/reports/:id/resolve', auth, adminAuth, adminController.resolveReport);

module.exports = router;
