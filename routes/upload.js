const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

router.post('/resume', auth.verifyToken, upload.single('resume'), uploadController.uploadResume);
router.post('/logo', auth.verifyToken, upload.single('logo'), uploadController.uploadLogo);
router.post('/portfolio', auth.verifyToken, upload.array('portfolio', 5), uploadController.uploadPortfolio);
router.delete('/:fileId', auth.verifyToken, uploadController.deleteFile);
router.get('/files', auth.verifyToken, uploadController.getUserFiles);

module.exports = router;
