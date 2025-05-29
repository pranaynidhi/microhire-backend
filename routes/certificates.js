
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const certificateController = require('../controllers/certificateController');

router.post('/generate', auth, certificateController.generateCertificate);
router.get('/:id', certificateController.getCertificate);
router.get('/verify/:certificateId', certificateController.verifyCertificate);
router.get('/user/my-certificates', auth, certificateController.getUserCertificates);

module.exports = router;
