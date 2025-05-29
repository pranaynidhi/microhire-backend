const express = require('express');
const {
  createInternship,
  getAllInternships,
  getInternshipById,
} = require('../controllers/internshipController');
const { verifyToken, isCompany } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllInternships);
router.get('/:id', getInternshipById);

// Protected routes
router.post('/', verifyToken, isCompany, createInternship);

module.exports = router;
