const { Application, Internship, User } = require('../models');
const { Op } = require('sequelize');
const withTransaction = require('../utils/transaction');
const cache = require('../utils/cache');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const notificationHelpers = require('../controllers/notificationController').notificationHelpers;

const createApplication = async (req, res) => {
  try {
    const result = await withTransaction(async (transaction) => {
      // Check if internship exists and is active
      const internship = await Internship.findOne({
        where: { 
          id: req.body.internshipId,
          status: 'active',
          deadline: { [Op.gt]: new Date() }
        },
        transaction
      });

      if (!internship) {
        throw new AppError('Internship not found or deadline has passed', 404);
      }

      // Check if user has already applied
      const existingApplication = await Application.findOne({
        where: {
          studentId: req.user.id,
          internshipId: req.body.internshipId
        },
        transaction
      });

      if (existingApplication) {
        throw new AppError('You have already applied for this internship', 400);
      }

      // Check if max applicants reached
      const applicationCount = await Application.count({
        where: { internshipId: req.body.internshipId },
        transaction
      });

      if (applicationCount >= internship.maxApplicants) {
        throw new AppError('Maximum number of applicants reached', 400);
      }

      // Create application
      const application = await Application.create({
        studentId: req.user.id,
        internshipId: req.body.internshipId,
        coverLetter: req.body.coverLetter,
        status: 'pending'
      }, { transaction });

      // Invalidate caches
      await Promise.all([
        cache.del(`internship:${req.body.internshipId}:applications`),
        cache.del(`student:${req.user.id}:applications`),
        cache.del(`company:${internship.companyId}:applications`)
      ]);

      // Send notification
      await notificationHelpers.applicationReceived(
        internship.companyId,
        req.user.fullName,
        internship.title
      );

      return application;
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application: result }
    });
  } catch (error) {
    logger.error('Create application error:', error);
    throw error;
  }
};

const getApplicationsByInternship = async (req, res) => {
  try {
    const cacheKey = `internship:${req.params.internshipId}:applications:${req.query.page}:${req.query.limit}`;
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const result = await withTransaction(async (transaction) => {
      const internship = await Internship.findOne({
        where: { 
          id: req.params.internshipId,
          companyId: req.user.id
        },
        transaction
      });

      if (!internship) {
        throw new AppError('Internship not found', 404);
      }

      const applications = await Application.findAndCountAll({
        where: { internshipId: req.params.internshipId },
        include: [{
          model: User,
          as: 'student',
          attributes: ['id', 'fullName', 'email', 'resumeUrl']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(req.query.limit) || 10,
        offset: (parseInt(req.query.page) - 1) * (parseInt(req.query.limit) || 10),
        transaction
      });

      return applications;
    });

    const response = {
      success: true,
      data: {
        applications: result.rows,
        pagination: {
          currentPage: parseInt(req.query.page) || 1,
          totalPages: Math.ceil(result.count / (parseInt(req.query.limit) || 10)),
          totalItems: result.count,
          itemsPerPage: parseInt(req.query.limit) || 10
        }
      }
    };

    await cache.set(cacheKey, response, 300); // Cache for 5 minutes

    res.json(response);
  } catch (error) {
    logger.error('Get applications error:', error);
    throw error;
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const result = await withTransaction(async (transaction) => {
      const application = await Application.findOne({
        where: { id: req.params.id },
        include: [{
          model: Internship,
          where: { companyId: req.user.id }
        }],
        transaction
      });

      if (!application) {
        throw new AppError('Application not found', 404);
      }

      await application.update({
        status: req.body.status,
        reviewedAt: new Date()
      }, { transaction });

      // Invalidate caches
      await Promise.all([
        cache.del(`internship:${application.internshipId}:applications`),
        cache.del(`student:${application.studentId}:applications`),
        cache.del(`company:${req.user.id}:applications`)
      ]);

      // Send notification
      await notificationHelpers.applicationStatusChanged(
        application.studentId,
        req.body.status,
        application.Internship.title,
        req.user.companyName
      );

      return application;
    });

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: { application: result }
    });
  } catch (error) {
    logger.error('Update application status error:', error);
    throw error;
  }
};

module.exports = {
  createApplication,
  getApplicationsByInternship,
  updateApplicationStatus,
};
