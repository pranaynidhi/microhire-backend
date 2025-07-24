const { Op } = require('sequelize');
const { Application, Internship, User } = require('../models');
const withTransaction = require('../utils/transaction');
const cache = require('../utils/cache');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const { notificationHelpers } = require('./notificationController');

const createApplication = async (req, res) => {
  try {
    const result = await withTransaction(async (transaction) => {
      // Check if internship exists and is active
      const internship = await Internship.findOne({
        where: {
          id: req.body.internshipId,
          status: 'active',
          deadline: { [Op.gt]: new Date() },
        },
        transaction,
      });

      if (!internship) {
        throw new AppError('Internship not found or deadline has passed', 404);
      }

      // Check if user has already applied
      const existingApplication = await Application.findOne({
        where: {
          studentId: req.user.id,
          internshipId: req.body.internshipId,
        },
        transaction,
      });

      if (existingApplication) {
        throw new AppError('You have already applied for this internship', 400);
      }

      // Check if max applicants reached
      const applicationCount = await Application.count({
        where: { internshipId: req.body.internshipId },
        transaction,
      });

      if (applicationCount >= internship.maxApplicants) {
        throw new AppError('Maximum number of applicants reached', 400);
      }

      // Create application
      const application = await Application.create(
        {
          studentId: req.user.id,
          internshipId: req.body.internshipId,
          coverLetter: req.body.coverLetter,
          status: 'pending',
        },
        { transaction }
      );

      // Invalidate caches
      await Promise.all([
        cache.del(`internship:${req.body.internshipId}:applications`),
        cache.del(`student:${req.user.id}:applications`),
        cache.del(`company:${internship.companyId}:applications`),
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
      data: { application: result },
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res
        .status(400)
        .json({ success: false, message: error.errors.map((e) => e.message).join(', ') });
    }
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
          companyId: req.user.id,
        },
        transaction,
      });

      if (!internship) {
        throw new AppError('Internship not found', 404);
      }

      const applications = await Application.findAndCountAll({
        where: { internshipId: req.params.internshipId },
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'fullName', 'email', 'resumeUrl'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(req.query.limit) || 10,
        offset: (parseInt(req.query.page) - 1) * (parseInt(req.query.limit) || 10),
        transaction,
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
          itemsPerPage: parseInt(req.query.limit) || 10,
        },
      },
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
        include: [
          {
            model: Internship,
            as: 'internship',
            where: { companyId: req.user.id },
          },
        ],
        transaction,
      });

      if (!application) {
        throw new AppError('Application not found', 404);
      }

      await application.update(
        {
          status: req.body.status,
          reviewedAt: new Date(),
        },
        { transaction }
      );

      // Invalidate caches
      await Promise.all([
        cache.del(`internship:${application.internshipId}:applications`),
        cache.del(`student:${application.studentId}:applications`),
        cache.del(`company:${req.user.id}:applications`),
      ]);

      // Send notification
      await notificationHelpers.applicationStatusChanged(
        application.studentId,
        req.body.status,
        application.internship.title,
        req.user.companyName
      );

      return application;
    });

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: { application: result },
    });
  } catch (error) {
    logger.error('Update application status error:', error);
    throw error;
  }
};

// Get all applications (filtered by role)
const getAllApplications = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'student') {
      where.studentId = req.user.id;
    } else if (req.user.role === 'business') {
      // Get all applications for internships owned by this company
      const internships = await Internship.findAll({
        where: { companyId: req.user.id },
        attributes: ['id'],
      });
      where.internshipId = internships.map((i) => i.id);
    }
    const applications = await Application.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'fullName', 'email'] },
        { model: Internship, as: 'internship', attributes: ['id', 'title'] },
      ],
    });
    res.json({ success: true, data: { applications } });
  } catch (error) {
    logger.error('Get all applications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findByPk(id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'fullName', 'email'] },
        { model: Internship, as: 'internship', attributes: ['id', 'title', 'companyId'] },
      ],
    });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    // Only the student or the company that owns the internship can view
    if (application.studentId !== req.user.id && application.internship.companyId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    res.json({ success: true, data: { application } });
  } catch (error) {
    logger.error('Get application by ID error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Delete/withdraw application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    // Only the student who created the application can delete
    if (application.studentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    await application.destroy();
    res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (error) {
    logger.error('Delete application error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Get applications submitted by the current student user
const getMyApplications = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const applications = await Application.findAll({
      where: { studentId: req.user.id },
      include: [
        {
          model: Internship,
          as: 'internship',
          include: [
            { model: require('../models').User, as: 'company', attributes: ['id', 'fullName', 'logoUrl'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

module.exports = {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByInternship,
  getMyApplications,
};
