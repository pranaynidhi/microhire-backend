
const Internship = require('../models/Internship');
const User = require('../models/User');
const Application = require('../models/Application');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const searchController = {
  advancedSearch: async (req, res) => {
    try {
      const {
        query,
        category,
        type,
        location,
        minStipend,
        maxStipend,
        duration,
        deadline,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        page = 1,
        limit = 10
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { status: 'active' };

      // Text search
      if (query) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { requirements: { [Op.like]: `%${query}%` } }
        ];
      }

      // Filters
      if (category) {
        whereClause.category = { [Op.like]: `%${category}%` };
      }

      if (type) {
        whereClause.type = type;
      }

      if (location) {
        whereClause.location = { [Op.like]: `%${location}%` };
      }

      if (minStipend || maxStipend) {
        whereClause.stipend = {};
        if (minStipend) {
          whereClause.stipend[Op.gte] = parseFloat(minStipend);
        }
        if (maxStipend) {
          whereClause.stipend[Op.lte] = parseFloat(maxStipend);
        }
      }

      if (duration) {
        whereClause.duration = { [Op.like]: `%${duration}%` };
      }

      if (deadline) {
        whereClause.deadline = { [Op.gte]: new Date(deadline) };
      }

      const internships = await Internship.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'company',
          attributes: ['id', 'companyName', 'email', 'logoUrl']
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          internships: internships.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(internships.count / limit),
            totalItems: internships.count,
            itemsPerPage: parseInt(limit)
          },
          filters: {
            query,
            category,
            type,
            location,
            minStipend,
            maxStipend,
            duration,
            sortBy,
            sortOrder
          }
        }
      });
    } catch (error) {
      console.error('Advanced search error:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed'
      });
    }
  },

  getRecommendations: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Recommendations are only available for students'
        });
      }

      // Get user's application history to understand preferences
      const userApplications = await Application.findAll({
        where: { userId: req.user.id },
        include: [{
          model: Internship,
          attributes: ['category', 'type', 'location']
        }],
        limit: 10,
        order: [['createdAt', 'DESC']]
      });

      // Extract preferences
      const categories = userApplications.map(app => app.Internship?.category).filter(Boolean);
      const types = userApplications.map(app => app.Internship?.type).filter(Boolean);
      const locations = userApplications.map(app => app.Internship?.location).filter(Boolean);

      // Get user skills for matching
      const userSkills = req.user.skills ? req.user.skills.toLowerCase().split(',').map(s => s.trim()) : [];

      const whereClause = {
        status: 'active',
        deadline: { [Op.gte]: new Date() }
      };

      // Build recommendation query
      const orConditions = [];

      if (categories.length > 0) {
        orConditions.push({ category: { [Op.in]: categories } });
      }

      if (types.length > 0) {
        orConditions.push({ type: { [Op.in]: types } });
      }

      if (locations.length > 0) {
        orConditions.push({ location: { [Op.in]: locations } });
      }

      // Skill-based matching
      if (userSkills.length > 0) {
        const skillConditions = userSkills.map(skill => ({
          [Op.or]: [
            { requirements: { [Op.like]: `%${skill}%` } },
            { description: { [Op.like]: `%${skill}%` } }
          ]
        }));
        orConditions.push(...skillConditions);
      }

      if (orConditions.length > 0) {
        whereClause[Op.or] = orConditions;
      }

      // Exclude internships user has already applied to
      const appliedInternshipIds = userApplications.map(app => app.internshipId);
      if (appliedInternshipIds.length > 0) {
        whereClause.id = { [Op.notIn]: appliedInternshipIds };
      }

      const recommendations = await Internship.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'company',
          attributes: ['id', 'companyName', 'email', 'logoUrl']
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: { 
          recommendations,
          basedOn: {
            categories: [...new Set(categories)],
            types: [...new Set(types)],
            locations: [...new Set(locations)],
            skills: userSkills
          }
        }
      });
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recommendations'
      });
    }
  },

  getSimilarInternships: async (req, res) => {
    try {
      const { id } = req.params;

      const internship = await Internship.findByPk(id);
      if (!internship) {
        return res.status(404).json({
          success: false,
          message: 'Internship not found'
        });
      }

      const similarInternships = await Internship.findAll({
        where: {
          id: { [Op.ne]: id },
          status: 'active',
          [Op.or]: [
            { category: internship.category },
            { type: internship.type },
            { location: { [Op.like]: `%${internship.location}%` } }
          ]
        },
        include: [{
          model: User,
          as: 'company',
          attributes: ['id', 'companyName', 'email', 'logoUrl']
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      res.json({
        success: true,
        data: { similarInternships }
      });
    } catch (error) {
      console.error('Get similar internships error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch similar internships'
      });
    }
  },

  getSearchSuggestions: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: { suggestions: [] }
        });
      }

      // Get title suggestions
      const titleSuggestions = await Internship.findAll({
        where: {
          title: { [Op.like]: `%${query}%` },
          status: 'active'
        },
        attributes: ['title'],
        group: ['title'],
        limit: 5
      });

      // Get category suggestions
      const categorySuggestions = await Internship.findAll({
        where: {
          category: { [Op.like]: `%${query}%` },
          status: 'active'
        },
        attributes: ['category'],
        group: ['category'],
        limit: 5
      });

      // Get location suggestions
      const locationSuggestions = await Internship.findAll({
        where: {
          location: { [Op.like]: `%${query}%` },
          status: 'active'
        },
        attributes: ['location'],
        group: ['location'],
        limit: 5
      });

      const suggestions = [
        ...titleSuggestions.map(item => ({ type: 'title', value: item.title })),
        ...categorySuggestions.map(item => ({ type: 'category', value: item.category })),
        ...locationSuggestions.map(item => ({ type: 'location', value: item.location }))
      ];

      res.json({
        success: true,
        data: { suggestions }
      });
    } catch (error) {
      console.error('Get search suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch search suggestions'
      });
    }
  }
};

module.exports = searchController;
