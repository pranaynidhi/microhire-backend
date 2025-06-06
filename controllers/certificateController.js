const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const crypto = require('crypto');
const Notification = require('../models/Notification');
const CertificateView = require('../models/CertificateView');
const CertificateVerification = require('../models/CertificateVerification');
const sequelize = require('../config/database');

const certificateController = {
  generateCertificate: async (req, res) => {
    try {
      const { 
        studentId, 
        internshipId, 
        startDate, 
        endDate, 
        skills, 
        performance 
      } = req.body;

      // Verify that the company owns the internship
      const internship = await Internship.findOne({
        where: { 
          id: internshipId, 
          companyId: req.user.id 
        }
      });

      if (!internship) {
        return res.status(404).json({
          success: false,
          message: 'Internship not found or you are not authorized'
        });
      }

      // Verify that the student completed the internship
      const application = await Application.findOne({
        where: {
          internshipId,
          userId: studentId,
          status: 'accepted'
        }
      });

      if (!application) {
        return res.status(400).json({
          success: false,
          message: 'Student did not complete this internship'
        });
      }

      // Check if certificate already exists
      const existingCertificate = await Certificate.findOne({
        where: {
          studentId,
          internshipId,
          companyId: req.user.id
        }
      });

      if (existingCertificate) {
        return res.status(409).json({
          success: false,
          message: 'Certificate already exists for this internship'
        });
      }

      // Get student and company details
      const student = await User.findByPk(studentId);
      const company = await User.findByPk(req.user.id);

      // Generate unique certificate ID
      const certificateId = `MH-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      const certificate = await Certificate.create({
        certificateId,
        studentId,
        companyId: req.user.id,
        internshipId,
        studentName: student.fullName,
        companyName: company.companyName,
        internshipTitle: internship.title,
        startDate,
        endDate,
        skills,
        performance
      });

      res.status(201).json({
        success: true,
        message: 'Certificate generated successfully',
        data: { certificate }
      });
    } catch (error) {
      console.error('Generate certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate certificate'
      });
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
      const { certificateId } = req.params;

      const certificate = await Certificate.findOne({
        where: { 
          certificateId,
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
        ]
      });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found or invalid'
        });
      }

      res.json({
        success: true,
        message: 'Certificate is valid',
        data: { 
          certificate: {
            id: certificate.id,
            certificateId: certificate.certificateId,
            studentName: certificate.studentName,
            companyName: certificate.companyName,
            internshipTitle: certificate.internshipTitle,
            startDate: certificate.startDate,
            endDate: certificate.endDate,
            performance: certificate.performance,
            issuedAt: certificate.issuedAt
          }
        }
      });
    } catch (error) {
      console.error('Verify certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify certificate'
      });
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