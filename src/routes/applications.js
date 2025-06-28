const express = require('express');
const router = express.Router();
const { authenticate, isStudent, isCompany, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const applicationController = require('../controllers/applicationController');

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Internship applications
 */

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications (filtered by role)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get('/', authenticate, applicationController.getAllApplications);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get application by ID
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Application details
 */
router.get('/:id', authenticate, applicationController.getApplicationById);

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Create application (student only)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Application created
 */
router.post('/', authenticate, isStudent, requireEmailVerification, applicationController.createApplication);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     summary: Update application status (company only)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application status updated
 */
router.patch('/:id/status', authenticate, isCompany, requireEmailVerification, applicationController.updateApplicationStatus);

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Withdraw application (student only)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Application withdrawn
 */
router.delete('/:id', authenticate, isStudent, requireEmailVerification, applicationController.deleteApplication);

module.exports = router;
