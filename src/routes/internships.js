const express = require('express');
const router = express.Router();
const { authenticate, isCompany, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const internshipController = require('../controllers/internshipController');

/**
 * @swagger
 * tags:
 *   name: Internships
 *   description: Internship management
 */

/**
 * @swagger
 * /api/internships:
 *   get:
 *     summary: Get all internships
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of internships
 */
router.get('/', authenticate, internshipController.getAllInternships);

/**
 * @swagger
 * /api/internships/{id}:
 *   get:
 *     summary: Get internship by ID
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Internship details
 */
router.get('/:id', authenticate, internshipController.getInternshipById);

/**
 * @swagger
 * /api/internships:
 *   post:
 *     summary: Create internship (company only)
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Internship created
 */
router.post('/', authenticate, isCompany, requireEmailVerification, internshipController.createInternship);

/**
 * @swagger
 * /api/internships/{id}:
 *   put:
 *     summary: Update internship (company only)
 *     tags: [Internships]
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
 *     responses:
 *       200:
 *         description: Internship updated
 */
router.put('/:id', authenticate, isCompany, requireEmailVerification, internshipController.updateInternship);

/**
 * @swagger
 * /api/internships/{id}:
 *   delete:
 *     summary: Delete internship (company only)
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Internship deleted
 */
router.delete('/:id', authenticate, isCompany, requireEmailVerification, internshipController.deleteInternship);

module.exports = router;
