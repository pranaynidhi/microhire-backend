const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const crypto = require('crypto');
const Notification = require('../models/Notification');
const CertificateView = require('../models/CertificateView');
const CertificateVerification = require('../models/CertificateVerification');
const sequelize = require('../config/database');
const withTransaction = require('../utils/transaction');
const cache = require('../utils/cache');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const certificateController = {
  generateCertificate: async (req, res) => {
    try {
      const result = await withTransaction(async (transaction) => {
        // Check if internship exists and is completed
        const internship = await Internship.findOne({
          where: { 
            id: req.body.internshipId,
            status: 'completed',
            companyId: req.user.id
          },
          include: [{
            model: User,
            as: 'student',
            attributes: ['id', 'fullName']
          }],
          transaction
        });

        if (!internship) {
          throw new AppError('Internship not found or not completed', 404);
        }

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
          where: {
            internshipId: req.body.internshipId
          },
          transaction
        });

        if (existingCertificate) {
          throw new AppError('Certificate already exists for this internship', 400);
        }

        // Generate certificate ID
        const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create certificate
        const certificate = await Certificate.create({
          certificateId,
          studentId: internship.studentId,
          companyId: req.user.id,
          internshipId: req.body.internshipId,
          studentName: internship.student.fullName,
          companyName: req.user.companyName,
          internshipTitle: internship.title,
          startDate: internship.startDate,
          endDate: internship.endDate,
          performance: req.body.performance,
          isValid: true
        }, { transaction });

        // Generate PDF
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, '../certificates', `${certificateId}.pdf`);
        
        doc.pipe(fs.createWriteStream(pdfPath));
        // Add certificate content
        doc.text(`Certificate of Completion`, { align: 'center' });
        doc.text(`This is to certify that`, { align: 'center' });
        doc.text(certificate.studentName, { align: 'center' });
        // ... Add more certificate content
        doc.end();

        // Invalidate caches
        await Promise.all([
          cache.del(`student:${certificate.studentId}:certificates`),
          cache.del(`company:${certificate.companyId}:certificates`)
        ]);

        return certificate;
      });

      res.status(201).json({
        success: true,
        message: 'Certificate generated successfully',
        data: { certificate: result }
      });
    } catch (error) {
      logger.error('Generate certificate error:', error);
      throw error;
    }
  },

  getCertificate: async (req, res) => {
    try {
      const certificate = await Certificate.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'fullName', 'email']
          },
          {
            model: User,
            as: 'company',
            attributes: ['id', 'companyName', 'email']
          },
          {
            model: Internship,
            attributes: ['id', 'title', 'description']
          }
        ]
      });

      if (!certificate || !certificate.isValid) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }

      res.json({
        success: true,
        data: { certificate }
      });
    } catch (error) {
      console.error('Get certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch certificate'
      });
    }
  },

  verifyCertificate: async (req, res) => {
    try {
      const cacheKey = `certificate:${req.params.certificateId}:verify`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        return res.json(cachedData);
      }

      const result = await withTransaction(async (transaction) => {
        const certificate = await Certificate.findOne({
          where: { 
            certificateId: req.params.certificateId,
            isValid: true 
          },
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'fullName']
            },
            {
              model: User,
              as: 'company',
              attributes: ['id', 'companyName']
            },
            {
              model: Internship,
              attributes: ['id', 'title']
            }
          ],
          transaction
        });

        if (!certificate) {
          throw new AppError('Certificate not found or invalid', 404);
        }

        return certificate;
      });

      const response = {
        success: true,
        message: 'Certificate is valid',
        data: { 
          certificate: {
            id: result.id,
            certificateId: result.certificateId,
            studentName: result.studentName,
            companyName: result.companyName,
            internshipTitle: result.internshipTitle,
            startDate: result.startDate,
            endDate: result.endDate,
            performance: result.performance,
            issuedAt: result.issuedAt
          }
        }
      };

      await cache.set(cacheKey, response, 3600); // Cache for 1 hour

      res.json(response);
    } catch (error) {
      logger.error('Verify certificate error:', error);
      throw error;
    }
  },

  getUserCertificates: async (req, res) => {
    try {
      const certificates = await Certificate.findAll({
        where: { 
          studentId: req.user.id,
          isValid: true 
        },
        include: [
          {
            model: User,
            as: 'company',
            attributes: ['id', 'companyName']
          },
          {
            model: Internship,
            attributes: ['id', 'title']
          }
        ],
        order: [['issuedAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { certificates }
      });
    } catch (error) {
      console.error('Get user certificates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch certificates'
      });
    }
  },

  generateShareLink: async (req, res) => {
    try {
      const { id } = req.params;
      const { expiresIn } = req.body; // in hours

      const certificate = await Certificate.findOne({
        where: {
          id,
          studentId: req.user.id,
          isValid: true,
          isRevoked: false
        }
      });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found or not authorized'
        });
      }

      const shareToken = crypto.randomBytes(32).toString('hex');
      const shareExpiresAt = new Date(Date.now() + (expiresIn || 24) * 60 * 60 * 1000);

      await certificate.update({
        shareToken,
        shareExpiresAt
      });

      res.json({
        success: true,
        data: {
          shareUrl: `${process.env.CLIENT_URL}/certificates/share/${shareToken}`
        }
      });
    } catch (error) {
      console.error('Generate share link error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate share link'
      });
    }
  },

  revokeCertificate: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const certificate = await Certificate.findOne({
        where: {
          id,
          companyId: req.user.id
        }
      });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found or not authorized'
        });
      }

      await certificate.update({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
        isValid: false
      });

      // Notify student
      await Notification.create({
        userId: certificate.studentId,
        title: 'Certificate Revoked',
        message: `Your certificate for ${certificate.internshipTitle} has been revoked.`,
        type: 'certificate_revoked',
        metadata: {
          certificateId: certificate.id,
          reason
        }
      });

      res.json({
        success: true,
        message: 'Certificate revoked successfully'
      });
    } catch (error) {
      console.error('Revoke certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke certificate'
      });
    }
  },

  getCertificateAnalytics: async (req, res) => {
    try {
      const { id } = req.params;

      const certificate = await Certificate.findOne({
        where: {
          id,
          companyId: req.user.id
        }
      });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found or not authorized'
        });
      }

      // Get view statistics
      const views = await CertificateView.findAll({
        where: { certificateId: id },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('viewedAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('viewedAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('viewedAt')), 'ASC']]
      });

      // Get verification statistics
      const verifications = await CertificateVerification.findAll({
        where: { certificateId: id },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('verifiedAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('verifiedAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('verifiedAt')), 'ASC']]
      });

      res.json({
        success: true,
        data: {
          totalViews: certificate.viewCount,
          views,
          verifications
        }
      });
    } catch (error) {
      console.error('Get certificate analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch certificate analytics'
      });
    }
  }
};

module.exports = certificateController; 