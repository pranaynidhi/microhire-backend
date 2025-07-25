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
 *     description: Retrieve a list of all users (admin only)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only admins can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/users',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.getAllUsers
);

// Get user by ID
router.get(
  '/users/:id',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.getUserById
);

// Update user role
router.patch(
  '/users/:id/role',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.updateUserRole
);

// Suspend user
router.patch(
  '/users/:id/suspend',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.suspendUser
);

// Unsuspend user
router.patch(
  '/users/:id/unsuspend',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.unsuspendUser
);

// Delete user
router.delete(
  '/users/:id',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.deleteUser
);

router.get(
  '/internships',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.getInternships
);
router.patch(
  '/internships/:id/moderate',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.moderateInternship
);
router.delete(
  '/internships/:id',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.deleteInternship
);
router.get(
  '/reports',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.getReports
);
router.post(
  '/reports/:id/resolve',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.resolveReport
);
router.get(
  '/dashboard',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.getDashboardOverview
);
router.get(
  '/settings',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.getSystemSettings
);
router.put(
  '/settings',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.updateSystemSettings
);

// Ban/Unban user routes
router.put(
  '/users/:id/ban',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.banUser
);
router.put(
  '/users/:id/unban',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.unbanUser
);

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

router.get(
  '/certificates',
  authenticate,
  requireEmailVerification,
  adminAuth,
  adminController.getCertificates
);

module.exports = router;
