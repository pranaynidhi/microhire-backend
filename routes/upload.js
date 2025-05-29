const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

router.post('/resume', auth, upload.single('resume'), uploadController.uploadResume);
router.post('/logo', auth, upload.single('logo'), uploadController.uploadLogo);
router.post('/portfolio', auth, upload.array('portfolio', 5), uploadController.uploadPortfolio);
router.delete('/:fileId', auth, uploadController.deleteFile);
router.get('/files', auth, uploadController.getUserFiles);

module.exports = router;
