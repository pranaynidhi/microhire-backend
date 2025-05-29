const { Internship, User, Application } = require('../models');
const { Op } = require('sequelize');

const createInternship = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      location,
      stipend,
      duration,
      deadline,
      type,
      category,
      maxApplicants,
    } = req.body;

    const internship = await Internship.create({
      title,
      description,
      requirements,
      location,
      stipend: stipend || 0,
      duration,
      deadline,
      type: type || 'onsite',
      category,
      maxApplicants: maxApplicants || 50,
      companyId: req.user.id,
    });

    await internship.reload({
      include: [
        {
          model: User,
          as: 'company',
          attributes: ['id', 'companyName', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Internship created successfully.',
      data: {
        internship,
      },
    });
  } catch (error) {
    console.error('Create internship error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
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

module.exports = {
  createInternship,
  getAllInternships,
  getInternshipById,
};
