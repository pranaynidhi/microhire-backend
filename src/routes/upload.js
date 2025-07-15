const express = require('express');

const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { uploadMiddleware, deleteFileMiddleware } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload
 */

/**
 * @swagger
 * /api/upload/resume:
 *   post:
 *     summary: Upload resume (student only)
 *     description: Upload a resume file for the current student user
 *     tags: [Upload]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Resume uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 file:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// router.post('/', authenticate, ...); // Removed due to syntax error

// Upload resume (student only)
router.post(
  '/resume',
  authenticate,
  requireEmailVerification,
  uploadMiddleware('resume'),
  async (req, res, next) => {
    try {
      const { fileInfo } = req;
      res.json({ message: 'Resume uploaded successfully', file: fileInfo });
    } catch (error) {
      next(error);
    }
  }
);

// Upload company logo (company only)
router.post(
  '/logo',
  authenticate,
  requireEmailVerification,
  uploadMiddleware('logo'),
  async (req, res, next) => {
    try {
      const { fileInfo } = req;
      res.json({ message: 'Logo uploaded successfully', file: fileInfo });
    } catch (error) {
      next(error);
    }
  }
);

// Upload portfolio (student only)
router.post(
  '/portfolio',
  authenticate,
  requireEmailVerification,
  uploadMiddleware('portfolio'),
  async (req, res, next) => {
    try {
      const { fileInfo } = req;
      res.json({ message: 'Portfolio uploaded successfully', file: fileInfo });
    } catch (error) {
      next(error);
    }
  }
);

// Delete file
router.delete(
  '/:filename',
  authenticate,
  requireEmailVerification,
  deleteFileMiddleware,
  async (req, res, next) => {
    try {
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/files', authenticate, requireEmailVerification, uploadController.getUserFiles);

module.exports = router;
