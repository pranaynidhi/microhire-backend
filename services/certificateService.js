const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const generateCertificatePDF = async (certificate) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape'
      });

      // Generate QR code with verification URL
      const verificationUrl = `${process.env.API_URL}/api/certificates/verify/${certificate.certificateId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

      // Add certificate content
      doc
        .font('Helvetica-Bold')
        .fontSize(40)
        .text('Certificate of Completion', { align: 'center' })
        .moveDown()
        .fontSize(20)
        .text('This is to certify that', { align: 'center' })
        .moveDown()
        .fontSize(30)
        .text(certificate.studentName, { align: 'center' })
        .moveDown()
        .fontSize(20)
        .text('has successfully completed the internship', { align: 'center' })
        .moveDown()
        .fontSize(25)
        .text(certificate.internshipTitle, { align: 'center' })
        .moveDown()
        .fontSize(20)
        .text(`at ${certificate.companyName}`, { align: 'center' })
        .moveDown()
        .fontSize(16)
        .text(`Duration: ${new Date(certificate.startDate).toLocaleDateString()} - ${new Date(certificate.endDate).toLocaleDateString()}`, { align: 'center' })
        .moveDown()
        .fontSize(14)
        .text(`Certificate ID: ${certificate.certificateId}`, { align: 'center' })
        .moveDown(2);

      // Add QR code
      doc.image(qrCodeDataUrl, {
        fit: [100, 100],
        align: 'center'
      });

      // Add footer
      doc
        .fontSize(12)
        .text('Verify this certificate at:', { align: 'center' })
        .text(verificationUrl, { align: 'center' });

      // Save PDF
      const pdfPath = path.join(__dirname, '../uploads/certificates', `${certificate.certificateId}.pdf`);
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);
      doc.end();

      stream.on('finish', () => {
        resolve(pdfPath);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateCertificatePDF
};
