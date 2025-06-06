const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const AnalyticsService = require('../services/analyticsService');

const analyticsController = {
  getOverview: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Total counts
      const totalUsers = await User.count();
      const totalInternships = await Internship.count();
      const totalApplications = await Application.count();
      
      // Recent activity
      const recentUsers = await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      const recentInternships = await Internship.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      const recentApplications = await Application.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // User role distribution
      const userRoleStats = await User.findAll({
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['role']
      });

      // Application status distribution
      const applicationStats = await Application.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalInternships,
            totalApplications,
            recentUsers,
            recentInternships,
            recentApplications
          },
          userRoleStats,
          applicationStats
        }
      });
    } catch (error) {
      console.error('Get analytics overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics overview'
      });
    }
  },

  getInternshipAnalytics: async (req, res) => {
    try {
      // Most popular categories
      const categoryStats = await Internship.findAll({
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['category'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10
      });

      // Internship type distribution
      const typeStats = await Internship.findAll({
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type']
      });

      // Location distribution
      const locationStats = await Internship.findAll({
        attributes: [
          'location',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['location'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10
      });

      // Monthly internship posting trends
      const monthlyTrends = await Internship.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) // Last 12 months
          }
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']]
      });

      res.json({
        success: true,
        data: {
          categoryStats,
          typeStats,
          locationStats,
          monthlyTrends
        }
      });
    } catch (error) {
      console.error('Get internship analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch internship analytics'
      });
    }
  },

  getApplicationAnalytics: async (req, res) => {
    try {
      // Application success rate
      const applicationStats = await Application.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Average applications per internship
      const avgApplications = await Application.findAll({
        attributes: [
          'internshipId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'applicationCount']
        ],
        group: ['internshipId']
      });

      const avgApplicationsPerInternship = avgApplications.length > 0 
        ? avgApplications.reduce((sum, item) => sum + parseInt(item.dataValues.applicationCount), 0) / avgApplications.length
        : 0;

      // Monthly application trends
      const monthlyApplications = await Application.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']]
      });

      res.json({
        success: true,
        data: {
          applicationStats,
          avgApplicationsPerInternship: Math.round(avgApplicationsPerInternship * 100) / 100,
          monthlyApplications
        }
      });
    } catch (error) {
      console.error('Get application analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch application analytics'
      });
    }
  },

  getUserAnalytics: async (req, res) => {
    try {
      // User registration trends
      const monthlyRegistrations = await User.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        group: [
          sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'),
          'role'
        ],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']]
      });

      // Active users (users who have applied or posted in last 30 days)
      const activeStudents = await User.count({
        where: {
          role: 'student'
        },
        include: [{
          model: Application,
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          required: true
        }]
      });

      const activeBusinesses = await User.count({
        where: {
          role: 'business'
        },
        include: [{
          model: Internship,
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          required: true
        }]
      });

      res.json({
        success: true,
        data: {
          monthlyRegistrations,
          activeUsers: {
            students: activeStudents,
            businesses: activeBusinesses
          }
        }
      });
    } catch (error) {
      console.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user analytics'
      });
    }
  },

  getRealTimeStats: async (req, res) => {
    try {
      const stats = await AnalyticsService.getRealTimeStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get real-time stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch real-time statistics'
      });
    }
  },

  getCustomDateRangeStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const stats = await AnalyticsService.getCustomDateRangeStats(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get custom date range stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch custom date range statistics'
      });
    }
  },

  exportAnalytics: async (req, res) => {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const data = await AnalyticsService.exportAnalytics(
        new Date(startDate),
        new Date(endDate),
        format
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
        return res.send(data);
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics'
      });
    }
  }
};

module.exports = analyticsController;
