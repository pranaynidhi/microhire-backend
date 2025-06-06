const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const certificateController = require('../controllers/certificateController');

router.post('/generate', auth.verifyToken, certificateController.generateCertificate);
router.get('/:id', certificateController.getCertificate);
router.get('/verify/:certificateId', certificateController.verifyCertificate);
router.get('/user/my-certificates', auth.verifyToken, certificateController.getUserCertificates);
router.post('/:id/share', auth.verifyToken, certificateController.generateShareLink);
router.post('/:id/revoke', auth.verifyToken, certificateController.revokeCertificate);
router.get('/:id/analytics', auth.verifyToken, certificateController.getCertificateAnalytics);

module.exports = router;
