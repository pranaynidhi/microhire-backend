const express = require('express');
const {
  createApplication,
  getApplicationsByInternship,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { verifyToken, isCompany, isStudent } = require('../middleware/auth');

const router = express.Router();

// Student routes
router.post('/', verifyToken, isStudent, createApplication);

// Company routes
router.get(
  '/internship/:id',
  verifyToken,
  isCompany,
  getApplicationsByInternship
);
router.patch('/:id', verifyToken, isCompany, updateApplicationStatus);

module.exports = router;
