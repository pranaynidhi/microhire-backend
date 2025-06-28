const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', authenticate, requireEmailVerification, adminController.getAllUsers);

// Get user by ID
router.get('/users/:id', authenticate, requireEmailVerification, adminController.getUserById);

// Update user role
router.patch('/users/:id/role', authenticate, requireEmailVerification, adminController.updateUserRole);

// Suspend user
router.patch('/users/:id/suspend', authenticate, requireEmailVerification, adminController.suspendUser);

// Unsuspend user
router.patch('/users/:id/unsuspend', authenticate, requireEmailVerification, adminController.unsuspendUser);

// Delete user
router.delete('/users/:id', authenticate, requireEmailVerification, adminController.deleteUser);

router.get('/internships', authenticate, requireEmailVerification, adminAuth, adminController.getInternships);
router.patch('/internships/:id/moderate', authenticate, requireEmailVerification, adminAuth, adminController.moderateInternship);
router.get('/reports', authenticate, requireEmailVerification, adminAuth, adminController.getReports);
router.post('/reports/:id/resolve', authenticate, requireEmailVerification, adminAuth, adminController.resolveReport);
router.get('/dashboard', authenticate, requireEmailVerification, adminAuth, adminController.getDashboardOverview);
router.get('/settings', authenticate, requireEmailVerification, adminAuth, adminController.getSystemSettings);
router.put('/settings', authenticate, requireEmailVerification, adminAuth, adminController.updateSystemSettings);

/**
 * @swagger
 * /api/admin/users/{id}/ban:
 *   patch:
 *     summary: Ban a user (admin only)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User banned
 */
// router.patch('/users/:id/ban', authenticate, requireAdmin, ...);

module.exports = router;
