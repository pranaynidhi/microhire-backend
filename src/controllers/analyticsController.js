const { Op } = require('sequelize');
const logger = require('../utils/logger');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const sequelize = require('../config/database');
const AnalyticsService = require('../services/analyticsService');

const analyticsController = {
  getDashboardStats: async (req, res) => {
    try {
      const { user } = req;
      let stats = {};

      if (user.role === 'student') {
        // Student dashboard stats
        const totalApplications = await Application.count({
          where: { studentId: user.id },
        });

        const pendingApplications = await Application.count({
          where: {
            studentId: user.id,
            status: 'pending',
          },
        });

        const interviews = await Application.count({
          where: {
            studentId: user.id,
            status: 'interviewing',
          },
        });

        const offers = await Application.count({
          where: {
            studentId: user.id,
            status: 'accepted',
          },
        });

        const rejections = await Application.count({
          where: {
            studentId: user.id,
            status: 'rejected',
          },
        });

        // Recent applications
        const recentApplications = await Application.findAll({
          where: { studentId: user.id },
          include: [
            {
              model: Internship,
              as: 'internship',
              attributes: ['id', 'title', 'companyId'],
              include: [
                {
                  model: User,
                  as: 'company',
                  attributes: ['companyName'],
                },
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
          limit: 5,
        });

        // Application status distribution
        const statusDistribution = await Application.findAll({
          where: { studentId: user.id },
          attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          group: ['status'],
        });

        stats = {
          totalApplications,
          pendingApplications,
          interviews,
          offers,
          rejections,
          recentApplications,
          statusDistribution,
          successRate: totalApplications > 0 ? ((offers / totalApplications) * 100).toFixed(1) : 0,
        };
      } else if (user.role === 'business') {
        // Business dashboard stats
        const activeInternships = await Internship.count({
          where: {
            companyId: user.id,
            status: 'active',
          },
        });

        const totalInternships = await Internship.count({
          where: { companyId: user.id },
        });

        const totalApplications = await Application.count({
          include: [
            {
              model: Internship,
              as: 'internship',
              where: { companyId: user.id },
            },
          ],
        });

        const pendingApplications = await Application.count({
          where: { status: 'pending' },
          include: [
            {
              model: Internship,
              as: 'internship',
              where: { companyId: user.id },
            },
          ],
        });

        const hiredInterns = await Application.count({
          where: { status: 'accepted' },
          include: [
            {
              model: Internship,
              as: 'internship',
              where: { companyId: user.id },
            },
          ],
        });

        // Recent applications to company's internships
        const recentApplications = await Application.findAll({
          include: [
            {
              model: Internship,
              as: 'internship',
              where: { companyId: user.id },
              attributes: ['id', 'title'],
            },
            {
              model: User,
              as: 'student',
              attributes: ['id', 'fullName', 'email'],
            },
          ],
          order: [['createdAt', 'DESC']],
          limit: 5,
        });

        // Top performing internships
        const topInternships = await Internship.findAll({
          where: { companyId: user.id },
          include: [
            {
              model: Application,
              as: 'applications',
              attributes: [],
            },
          ],
          attributes: [
            'id',
            'title',
            [sequelize.fn('COUNT', sequelize.col('applications.id')), 'applicationCount'],
          ],
          group: ['Internship.id'],
          order: [[sequelize.literal('applicationCount'), 'DESC']],
          limit: 5,
        });

        stats = {
          activeInternships,
          totalInternships,
          totalApplications,
          pendingApplications,
          hiredInterns,
          recentApplications,
          topInternships,
          hiringRate:
            totalApplications > 0 ? ((hiredInterns / totalApplications) * 100).toFixed(1) : 0,
        };
      } else if (user.role === 'admin') {
        // Admin dashboard stats
        const totalUsers = await User.count();
        const activeUsers = await User.count({
          where: { isActive: true },
        });
        const studentsCount = await User.count({
          where: { role: 'student' },
        });
        const businessCount = await User.count({
          where: { role: 'business' },
        });

        const totalInternships = await Internship.count();
        const activeInternships = await Internship.count({
          where: { status: 'active' },
        });

        const totalApplications = await Application.count();

        // Recent registrations
        const recentUsers = await User.findAll({
          attributes: ['id', 'fullName', 'email', 'role', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 5,
        });

        // Platform growth (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newUsersThisMonth = await User.count({
          where: {
            createdAt: {
              [Op.gte]: thirtyDaysAgo,
            },
          },
        });

        const newInternshipsThisMonth = await Internship.count({
          where: {
            createdAt: {
              [Op.gte]: thirtyDaysAgo,
            },
          },
        });

        const newApplicationsThisMonth = await Application.count({
          where: {
            createdAt: {
              [Op.gte]: thirtyDaysAgo,
            },
          },
        });

        stats = {
          totalUsers,
          activeUsers,
          studentsCount,
          businessCount,
          totalInternships,
          activeInternships,
          totalApplications,
          recentUsers,
          growth: {
            newUsersThisMonth,
            newInternshipsThisMonth,
            newApplicationsThisMonth,
          },
          platformHealth: {
            userGrowthRate: (
              (newUsersThisMonth / Math.max(totalUsers - newUsersThisMonth, 1)) *
              100
            ).toFixed(1),
            averageApplicationsPerInternship:
              totalInternships > 0 ? (totalApplications / totalInternships).toFixed(1) : 0,
          },
        };
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
      });
    }
  },

  getOverview: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
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
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      const recentInternships = await Internship.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const recentApplications = await Application.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // User role distribution
      const userRoleStats = await User.findAll({
        attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['role'],
      });

      // Application status distribution
      const applicationStats = await Application.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
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
            recentApplications,
          },
          userRoleStats,
          applicationStats,
        },
      });
    } catch (error) {
      logger.error('Get analytics overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics overview',
      });
    }
  },

  getInternshipAnalytics: async (req, res) => {
    try {
      // Most popular categories
      const categoryStats = await Internship.findAll({
        attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['category'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
      });

      // Internship type distribution
      const typeStats = await Internship.findAll({
        attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['type'],
      });

      // Location distribution
      const locationStats = await Internship.findAll({
        attributes: ['location', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['location'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
      });

      // Monthly internship posting trends
      const monthlyTrends = await Internship.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // Last 12 months
          },
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      });

      res.json({
        success: true,
        data: {
          categoryStats,
          typeStats,
          locationStats,
          monthlyTrends,
        },
      });
    } catch (error) {
      logger.error('Get internship analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch internship analytics',
      });
    }
  },

  getApplicationAnalytics: async (req, res) => {
    try {
      // Application success rate
      const applicationStats = await Application.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
      });

      // Average applications per internship
      const avgApplications = await Application.findAll({
        attributes: [
          'internshipId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'applicationCount'],
        ],
        group: ['internshipId'],
      });

      const avgApplicationsPerInternship =
        avgApplications.length > 0
          ? avgApplications.reduce(
              (sum, item) => sum + parseInt(item.dataValues.applicationCount),
              0
            ) / avgApplications.length
          : 0;

      // Monthly application trends
      const monthlyApplications = await Application.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
          },
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      });

      res.json({
        success: true,
        data: {
          applicationStats,
          avgApplicationsPerInternship: Math.round(avgApplicationsPerInternship * 100) / 100,
          monthlyApplications,
        },
      });
    } catch (error) {
      logger.error('Get application analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch application analytics',
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
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
          },
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'role'],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      });

      // Active users (users who have applied or posted in last 30 days)
      const activeStudents = await User.count({
        where: {
          role: 'student',
        },
        include: [
          {
            model: Application,
            where: {
              createdAt: {
                [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
            required: true,
          },
        ],
      });

      const activeBusinesses = await User.count({
        where: {
          role: 'business',
        },
        include: [
          {
            model: Internship,
            where: {
              createdAt: {
                [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
            required: true,
          },
        ],
      });

      res.json({
        success: true,
        data: {
          monthlyRegistrations,
          activeUsers: {
            students: activeStudents,
            businesses: activeBusinesses,
          },
        },
      });
    } catch (error) {
      logger.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user analytics',
      });
    }
  },

  getRealTimeStats: async (req, res) => {
    try {
      const stats = await AnalyticsService.getRealTimeStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get real-time stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch real-time statistics',
      });
    }
  },

  getCustomDateRangeStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
        return null;
      }

      const stats = await AnalyticsService.getCustomDateRangeStats(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: stats,
      });
      return stats;
    } catch (error) {
      logger.error('Get custom date range stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch custom date range statistics',
      });
      return null;
    }
  },

  exportAnalytics: async (req, res) => {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
        return null;
      }

      const data = await AnalyticsService.exportAnalytics(
        new Date(startDate),
        new Date(endDate),
        format
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
        res.send(data);
        return data;
      }

      res.json({
        success: true,
        data,
      });
      return data;
    } catch (error) {
      logger.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics',
      });
      return null;
    }
  },
};

// Add stubs if missing
const getPlatformAnalytics =
  analyticsController.getOverview ||
  ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));
const getUserAnalytics =
  analyticsController.getUserAnalytics ||
  ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));
const getCompanyAnalytics =
  analyticsController.getCompanyAnalytics ||
  ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = {
  ...analyticsController,
  getPlatformAnalytics,
  getUserAnalytics,
  getCompanyAnalytics,
};
