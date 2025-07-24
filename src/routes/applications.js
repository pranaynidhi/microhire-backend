const express = require('express');

const router = express.Router();
const {
  authenticate,
  isStudent,
  isCompany,
  requireEmailVerification,
} = require('../middleware/auth');
const applicationController = require('../controllers/applicationController');
const { Application, Internship, Interview } = require('../models');

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Internship application management
 */

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications (filtered by role)
 *     description: Retrieve applications based on user role - students see their own applications, companies see applications for their internships
 *     tags: [Applications]
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
 *         description: Number of applications per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, accepted, rejected, withdrawn]
 *         description: Filter applications by status
 *       - in: query
 *         name: internshipId
 *         schema:
 *           type: integer
 *         description: Filter applications by internship ID
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
 */
router.get('/', authenticate, applicationController.getAllApplications);

/**
 * @swagger
 * /api/applications/me:
 *   get:
 *     summary: Get applications submitted by the current student user
 *     description: Retrieve applications submitted by the currently authenticated student user.
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
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
 */
router.get('/me', authenticate, isStudent, requireEmailVerification, applicationController.getMyApplications);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get application by ID
 *     description: Retrieve detailed information about a specific application
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 application:
 *                   $ref: '#/components/schemas/Application'
 *                 student:
 *                   $ref: '#/components/schemas/User'
 *                 internship:
 *                   $ref: '#/components/schemas/Internship'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - you can only view your own applications or applications for your internships
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, applicationController.getApplicationById);

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Create application (student only)
 *     description: Submit a new internship application (only available to student users)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - internshipId
 *               - coverLetter
 *             properties:
 *               internshipId:
 *                 type: integer
 *                 description: ID of the internship to apply for
 *               coverLetter:
 *                 type: string
 *                 description: Cover letter explaining why you want this internship
 *               resume:
 *                 type: string
 *                 description: URL to uploaded resume file
 *               portfolio:
 *                 type: string
 *                 description: URL to portfolio or additional documents
 *               additionalInfo:
 *                 type: string
 *                 description: Any additional information for the application
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 application:
 *                   $ref: '#/components/schemas/Application'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only student users can submit applications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: You have already applied for this internship
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticate,
  isStudent,
  requireEmailVerification,
  applicationController.createApplication
);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     summary: Update application status (company only)
 *     description: Update the status of an application (only available to the company that posted the internship)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, accepted, rejected, withdrawn]
 *                 description: New status for the application
 *               feedback:
 *                 type: string
 *                 description: Optional feedback for the applicant
 *               interviewDate:
 *                 type: string
 *                 format: date-time
 *                 description: Interview date if status is accepted
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 application:
 *                   $ref: '#/components/schemas/Application'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the company that posted the internship can update application status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id/status',
  authenticate,
  isCompany,
  requireEmailVerification,
  applicationController.updateApplicationStatus
);

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Withdraw application (student only)
 *     description: Withdraw an internship application (only available to the student who submitted it)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application withdrawn successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the student who submitted the application can withdraw it
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticate,
  isStudent,
  requireEmailVerification,
  applicationController.deleteApplication
);

/**
 * @swagger
 * /api/applications/{id}/feedback:
 *   post:
 *     summary: Add feedback to application (company only)
 *     description: Add feedback or comments to an application (only available to the company that posted the internship)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback
 *             properties:
 *               feedback:
 *                 type: string
 *                 description: Feedback or comments for the applicant
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating for the application (1-5)
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the company that posted the internship can add feedback
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/feedback',
  authenticate,
  isCompany,
  requireEmailVerification,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { feedback, rating } = req.body;

      if (!feedback) {
        return res.status(400).json({
          success: false,
          message: 'Feedback is required',
        });
      }

      const application = await Application.findByPk(id, {
        include: [
          {
            model: Internship,
            where: { companyId: req.user.id },
          },
        ],
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or you do not have permission to add feedback',
        });
      }

      // Update application with feedback
      await application.update({
        feedback,
        rating: rating || null,
        reviewedAt: new Date(),
      });

      res.json({
        success: true,
        message: 'Feedback added successfully',
        application,
      });
      
    } catch (error) {
      next(error);
      
    }
  }
);

/**
 * @swagger
 * /api/applications/{id}/interview:
 *   post:
 *     summary: Schedule interview (company only)
 *     description: Schedule an interview for an accepted application (only available to the company that posted the internship)
 *     tags: [Applications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interviewDate
 *               - interviewType
 *             properties:
 *               interviewDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time for the interview
 *               interviewType:
 *                 type: string
 *                 enum: [video, phone, onsite]
 *                 description: Type of interview
 *               location:
 *                 type: string
 *                 description: Interview location (for onsite interviews)
 *               meetingLink:
 *                 type: string
 *                 description: Meeting link (for video interviews)
 *               notes:
 *                 type: string
 *                 description: Additional notes for the interview
 *     responses:
 *       200:
 *         description: Interview scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the company that posted the internship can schedule interviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/interview',
  authenticate,
  isCompany,
  requireEmailVerification,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { interviewDate, interviewType, location, notes } = req.body;

      if (!interviewDate || !interviewType) {
        return res.status(400).json({
          success: false,
          message: 'Interview date and type are required',
        });
      }

      const application = await Application.findByPk(id, {
        include: [
          {
            model: Internship,
            where: { companyId: req.user.id },
          },
        ],
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or you do not have permission to schedule interview',
        });
      }

      // Create interview record
      const interview = await Interview.create({
        applicationId: id,
        interviewDate: new Date(interviewDate),
        interviewType,
        location: location || null,
        notes: notes || null,
        status: 'scheduled',
      });

      // Update application status
      await application.update({
        status: 'interview_scheduled',
      });

      res.json({
        success: true,
        message: 'Interview scheduled successfully',
        interview,
      });
      
    } catch (error) {
      next(error);
      
    }
  }
);

module.exports = router;
