const express = require('express');
const router = express.Router();
const { authenticate, isStudent, requireEmailVerification } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const certificateController = require('../controllers/certificateController');

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Certificate management
 */

/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: Get all certificates for the user
 *     description: Retrieve all certificates issued to the current user
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of certificates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 certificates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Certificate'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticate, requireEmailVerification, certificateController.getAllCertificates);

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get certificate by ID
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Certificate details
 */
router.get('/:id', authenticate, requireEmailVerification, certificateController.getCertificateById);

/**
 * @swagger
 * /api/certificates:
 *   post:
 *     summary: Generate a certificate (company only)
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Certificate generated
 */
router.post('/', authenticate, requireEmailVerification, certificateController.addCertificate);

// Update certificate (student only)
router.put('/:id', authenticate, requireEmailVerification, certificateController.updateCertificate);

/**
 * @swagger
 * /api/certificates/{id}/revoke:
 *   patch:
 *     summary: Revoke a certificate (company only)
 *     tags: [Certificates]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certificate revoked
 */
router.delete('/:id', authenticate, requireEmailVerification, certificateController.deleteCertificate);

router.post('/generate', authenticate, certificateController.generateCertificate);
router.get('/verify/:certificateId', certificateController.verifyCertificate);
router.get('/user/my-certificates', authenticate, certificateController.getUserCertificates);
router.post('/:id/share', authenticate, certificateController.generateShareLink);
router.get('/:id/analytics', authenticate, certificateController.getCertificateAnalytics);

module.exports = router;
