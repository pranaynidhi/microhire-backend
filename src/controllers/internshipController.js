const { Internship, User, Application } = require('../models');
const { Op } = require('sequelize');
const withTransaction = require('../utils/transaction');
const cache = require('../utils/cache');
const { AppError, ErrorTypes } = require('../utils/errors');
const logger = require('../utils/logger');

const createInternship = async (req, res) => {
  try {
    const result = await withTransaction(async (transaction) => {
      const internship = await Internship.create({
        ...req.body,
        companyId: req.user.id
      }, { transaction });

      // Invalidate cache
      await cache.del(`company:${req.user.id}:internships`);

      return internship;
    });

    res.status(201).json({
      success: true,
      message: 'Internship created successfully',
      data: { internship: result }
    });
  } catch (error) {
    logger.error('Create internship error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      throw new AppError('Validation error', 400, error.errors);
    }
    
    throw error;
  }
};

const getAllInternships = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      type,
      category,
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      status: 'active',
      deadline: {
        [Op.gte]: new Date(),
      },
    };

    // Add search filters
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (location) {
      whereClause.location = { [Op.like]: `%${location}%` };
    }

    if (type) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = { [Op.like]: `%${category}%` };
    }

    const { count, rows: internships } = await Internship.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'company',
          attributes: ['id', 'companyName', 'email'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        internships,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get internships error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getInternshipById = async (req, res) => {
  try {
    const { id } = req.params;

    const internship = await Internship.findByPk(id, {
      include: [
        {
          model: User,
          as: 'company',
          attributes: [
            'id',
            'companyName',
            'email',
            'companyDescription',
            'website',
          ],
        },
      ],
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.',
      });
    }

    res.json({
      success: true,
      data: {
        internship,
      },
    });
  } catch (error) {
    console.error('Get internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getInternships = async (req, res) => {
  try {
    const cacheKey = `internships:${req.query.page}:${req.query.limit}`;
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const internships = await Internship.findAndCountAll({
      where: { status: 'active' },
      include: [{
        model: User,
        as: 'company',
        attributes: ['id', 'companyName', 'email']
      }],
      limit: parseInt(req.query.limit) || 10,
      offset: (parseInt(req.query.page) - 1) * (parseInt(req.query.limit) || 10)
    });

    const response = {
      success: true,
      data: {
        internships: internships.rows,
        pagination: {
          currentPage: parseInt(req.query.page) || 1,
          totalPages: Math.ceil(internships.count / (parseInt(req.query.limit) || 10)),
          totalItems: internships.count,
          itemsPerPage: parseInt(req.query.limit) || 10
        }
      }
    };

    await cache.set(cacheKey, response, 300); // Cache for 5 minutes

    res.json(response);
  } catch (error) {
    logger.error('Get internships error:', error);
    throw error;
  }
};

module.exports = {
  createInternship,
  getAllInternships,
  getInternshipById,
  getInternships,
};
