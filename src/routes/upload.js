const express = require('express');
const router = express.Router();
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { uploadMiddleware, deleteFileMiddleware } = require('../middleware/upload');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const uploadController = require('../controllers/uploadController');

// Upload resume (student only)
router.post('/resume', authenticate, requireEmailVerification, uploadMiddleware('resume'), async (req, res, next) => {
  try {
    const fileInfo = req.fileInfo;
    res.json({ message: 'Resume uploaded successfully', file: fileInfo });
  } catch (error) {
    next(error);
  }
});

// Upload company logo (company only)
router.post('/logo', authenticate, requireEmailVerification, uploadMiddleware('logo'), async (req, res, next) => {
  try {
    const fileInfo = req.fileInfo;
    res.json({ message: 'Logo uploaded successfully', file: fileInfo });
  } catch (error) {
    next(error);
  }
});

// Upload portfolio (student only)
router.post('/portfolio', authenticate, requireEmailVerification, uploadMiddleware('portfolio'), async (req, res, next) => {
  try {
    const fileInfo = req.fileInfo;
    res.json({ message: 'Portfolio uploaded successfully', file: fileInfo });
  } catch (error) {
    next(error);
  }
});

// Delete file
router.delete('/:filename', authenticate, requireEmailVerification, deleteFileMiddleware, async (req, res, next) => {
  try {
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/files', authenticate, requireEmailVerification, uploadController.getUserFiles);

module.exports = router;
