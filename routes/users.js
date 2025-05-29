const express = require('express');
const {
  getProfile,
  updateProfile,
  getMyApplications,
  getMyInternships,
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken); // All user routes require authentication

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.get('/me/applications', getMyApplications);
router.get('/me/internships', getMyInternships);

module.exports = router;
