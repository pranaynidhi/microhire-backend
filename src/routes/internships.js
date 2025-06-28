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
 *   description: Internship management and operations
 */

/**
 * @swagger
 * /api/internships:
 *   get:
 *     summary: Get all internships
 *     description: Retrieve a list of all available internships with optional filtering and pagination
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of internships per page
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [remote, onsite, hybrid]
 *         description: Filter by internship type
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Filter by required skills (comma-separated)
 *       - in: query
 *         name: minStipend
 *         schema:
 *           type: number
 *         description: Minimum stipend amount
 *       - in: query
 *         name: maxStipend
 *         schema:
 *           type: number
 *         description: Maximum stipend amount
 *     responses:
 *       200:
 *         description: Internships retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 internships:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Internship'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticate, internshipController.getAllInternships);

/**
 * @swagger
 * /api/internships/{id}:
 *   get:
 *     summary: Get internship by ID
 *     description: Retrieve detailed information about a specific internship
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internship ID
 *     responses:
 *       200:
 *         description: Internship details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 internship:
 *                   $ref: '#/components/schemas/Internship'
 *                 company:
 *                   $ref: '#/components/schemas/User'
 *                 applications:
 *                   type: integer
 *                   description: Number of applications for this internship
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', authenticate, internshipController.getInternshipById);

/**
 * @swagger
 * /api/internships:
 *   post:
 *     summary: Create internship (company only)
 *     description: Create a new internship posting (only available to company users)
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - type
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *                 description: Internship title
 *               description:
 *                 type: string
 *                 description: Detailed internship description
 *               location:
 *                 type: string
 *                 description: Internship location
 *               type:
 *                 type: string
 *                 enum: [remote, onsite, hybrid]
 *                 description: Type of internship
 *               duration:
 *                 type: string
 *                 description: Duration of the internship
 *               stipend:
 *                 type: number
 *                 description: Monthly stipend amount
 *               requirements:
 *                 type: string
 *                 description: Requirements for the internship
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Required skills for the internship
 *     responses:
 *       201:
 *         description: Internship created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 internship:
 *                   $ref: '#/components/schemas/Internship'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only company users can create internships
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, isCompany, requireEmailVerification, internshipController.createInternship);

/**
 * @swagger
 * /api/internships/{id}:
 *   put:
 *     summary: Update internship (company only)
 *     description: Update an existing internship posting (only available to the company that created it)
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internship ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Internship title
 *               description:
 *                 type: string
 *                 description: Detailed internship description
 *               location:
 *                 type: string
 *                 description: Internship location
 *               type:
 *                 type: string
 *                 enum: [remote, onsite, hybrid]
 *                 description: Type of internship
 *               duration:
 *                 type: string
 *                 description: Duration of the internship
 *               stipend:
 *                 type: number
 *                 description: Monthly stipend amount
 *               requirements:
 *                 type: string
 *                 description: Requirements for the internship
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Required skills for the internship
 *               status:
 *                 type: string
 *                 enum: [active, inactive, closed]
 *                 description: Internship status
 *     responses:
 *       200:
 *         description: Internship updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 internship:
 *                   $ref: '#/components/schemas/Internship'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the company that created the internship can update it
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', authenticate, isCompany, requireEmailVerification, internshipController.updateInternship);

/**
 * @swagger
 * /api/internships/{id}:
 *   delete:
 *     summary: Delete internship (company only)
 *     description: Delete an internship posting (only available to the company that created it)
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internship ID
 *     responses:
 *       200:
 *         description: Internship deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the company that created the internship can delete it
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', authenticate, isCompany, requireEmailVerification, internshipController.deleteInternship);

/**
 * @swagger
 * /api/internships/{id}/applications:
 *   get:
 *     summary: Get applications for internship (company only)
 *     description: Retrieve all applications for a specific internship (only available to the company that created it)
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internship ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, accepted, rejected, withdrawn]
 *         description: Filter applications by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of applications per page
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the company that created the internship can view applications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/applications', authenticate, isCompany, requireEmailVerification, (req, res) => {
  // Implement get applications for internship logic
  res.json({ success: true, message: 'Get applications for internship endpoint' });
});

/**
 * @swagger
 * /api/internships/{id}/bookmark:
 *   post:
 *     summary: Bookmark internship (student only)
 *     description: Add an internship to the current user's bookmarks
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internship ID
 *     responses:
 *       200:
 *         description: Internship bookmarked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/bookmark', authenticate, (req, res) => {
  // Implement bookmark internship logic
  res.json({ success: true, message: 'Bookmark internship endpoint' });
});

/**
 * @swagger
 * /api/internships/{id}/bookmark:
 *   delete:
 *     summary: Remove bookmark (student only)
 *     description: Remove an internship from the current user's bookmarks
 *     tags: [Internships]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internship ID
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id/bookmark', authenticate, (req, res) => {
  // Implement remove bookmark logic
  res.json({ success: true, message: 'Remove bookmark endpoint' });
});

module.exports = router;
