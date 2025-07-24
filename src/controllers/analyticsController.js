const { Op } = require('sequelize');
const logger = require('../utils/logger');
const db = require('../models');
const { sequelize } = require('../config/database');
const AnalyticsService = require('../services/analyticsService');

const analyticsController = {
  getDashboardStats: async (req, res) => {
    try {
      const { user } = req;
      let stats = {};

      if (user.role === 'student') {
        // Student dashboard stats
        const totalApplications = await db.Application.count({
          where: { studentId: user.id },
        });

        const pendingApplications = await db.Application.count({
          where: {
            studentId: user.id,
            status: 'pending',
          },
        });

        const interviews = await db.Application.count({
          where: {
            studentId: user.id,
            status: 'interviewing',
          },
        });

        const offers = await db.Application.count({
          where: {
            studentId: user.id,
            status: 'accepted',
          },
        });

        const rejections = await db.Application.count({
          where: {
            studentId: user.id,
            status: 'rejected',
          },
        });

        // Recent applications
        const recentApplications = await db.Application.findAll({
          where: { studentId: user.id },
          include: [
            {
              model: db.Internship,
              as: 'internship',
              attributes: ['id', 'title', 'companyId'],
              include: [
                {
                  model: db.User,
                  as: 'company',
                  attributes: ['id', 'fullName', 'role'],
                },
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
          limit: 5,
        });

        // Application status distribution
        const statusDistribution = await db.Application.findAll({
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
        const activeInternships = await db.Internship.count({
          where: {
            companyId: user.id,
            status: 'active',
          },
        });

        const totalInternships = await db.Internship.count({
          where: { companyId: user.id },
        });

        const totalApplications = await db.Application.count({
          include: [
            {
              model: db.Internship,
              as: 'internship',
              where: { companyId: user.id },
            },
          ],
        });

        const pendingApplications = await db.Application.count({
          where: { status: 'pending' },
          include: [
            {
              model: db.Internship,
              as: 'internship',
              where: { companyId: user.id },
            },
          ],
        });

        const hiredInterns = await db.Application.count({
          where: { status: 'accepted' },
          include: [
            {
              model: db.Internship,
              as: 'internship',
              where: { companyId: user.id },
            },
          ],
        });

        // Recent applications to company's internships
        const recentApplications = await db.Application.findAll({
          include: [
            {
              model: db.Internship,
              as: 'internship',
              where: { companyId: user.id },
              attributes: ['id', 'title'],
            },
            {
              model: db.User,
              as: 'student',
              attributes: ['id', 'fullName', 'email'],
            },
          ],
          order: [['createdAt', 'DESC']],
          limit: 5,
        });

        // Top performing internships
        const topInternships = await db.Internship.findAll({
          where: { companyId: user.id },
          include: [
            {
              model: db.Application,
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
        const totalUsers = await db.User.count();
        const activeUsers = await db.User.count({
          where: { isActive: true },
        });
        const studentsCount = await db.User.count({
          where: { role: 'student' },
        });
        const businessCount = await db.User.count({
          where: { role: 'business' },
        });

        const totalInternships = await db.Internship.count();
        const activeInternships = await db.Internship.count({
          where: { status: 'active' },
        });

        const totalApplications = await db.Application.count();

        // Recent registrations
        const recentUsers = await db.User.findAll({
          attributes: ['id', 'fullName', 'email', 'role', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 5,
        });

        // Platform growth (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newUsersThisMonth = await db.User.count({
          where: {
            createdAt: {
              [Op.gte]: thirtyDaysAgo,
            },
          },
        });

        const newInternshipsThisMonth = await db.Internship.count({
          where: {
            createdAt: {
              [Op.gte]: thirtyDaysAgo,
            },
          },
        });

        const newApplicationsThisMonth = await db.Application.count({
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
      const totalUsers = await db.User.count();
      const totalInternships = await db.Internship.count();
      const totalApplications = await db.Application.count();

      // Recent activity
      const recentUsers = await db.User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      const recentInternships = await db.Internship.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const recentApplications = await db.Application.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // User role distribution
      const userRoleStats = await db.User.findAll({
        attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['role'],
      });

      // Application status distribution
      const applicationStats = await db.Application.findAll({
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
      const categoryStats = await db.Internship.findAll({
        attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['category'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
      });

      // Internship type distribution
      const typeStats = await db.Internship.findAll({
        attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['type'],
      });

      // Location distribution
      const locationStats = await db.Internship.findAll({
        attributes: ['location', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['location'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
      });

      // Monthly internship posting trends
      const monthlyTrends = await db.Internship.findAll({
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
      const applicationStats = await db.Application.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
      });

      // Average applications per internship
      const avgApplications = await db.Application.findAll({
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
      const monthlyApplications = await db.Application.findAll({
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
      const { user } = req;
      // Example: return application stats for the user
      const totalApplications = await db.Application.count({ where: { studentId: user.id } });
      const accepted = await db.Application.count({ where: { studentId: user.id, status: 'accepted' } });
      const rejected = await db.Application.count({ where: { studentId: user.id, status: 'rejected' } });
      const pending = await db.Application.count({ where: { studentId: user.id, status: 'pending' } });
      res.json({
        success: true,
        data: {
          totalApplications,
          accepted,
          rejected,
          pending
        }
      });
    } catch (error) {
      logger.error('Get user analytics error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user analytics' });
    }
  },

  getCompanyAnalytics: async (req, res) => {
    try {
      const { user } = req;
      // Total internships posted by the company
      const totalInternships = await db.Internship.count({ where: { companyId: user.id } });
      // Active internships
      const activeInternships = await db.Internship.count({ where: { companyId: user.id, status: 'active' } });
      // Total applications to company's internships
      const totalApplications = await db.Application.count({
        include: [{ model: db.Internship, as: 'internship', where: { companyId: user.id } }]
      });
      // Applications with status 'accepted' (hired interns)
      const hiredInterns = await db.Application.count({
        where: { status: 'accepted' },
        include: [{ model: db.Internship, as: 'internship', where: { companyId: user.id } }]
      });
      // Applications with status 'pending'
      const pendingApplications = await db.Application.count({
        where: { status: 'pending' },
        include: [{ model: db.Internship, as: 'internship', where: { companyId: user.id } }]
      });
      // Hiring rate
      const hiringRate = totalApplications > 0 ? ((hiredInterns / totalApplications) * 100).toFixed(1) : 0;
      // Recent applications to company's internships
      const recentApplications = await db.Application.findAll({
        include: [
          { model: db.Internship, as: 'internship', where: { companyId: user.id }, attributes: ['id', 'title'] },
          { model: db.User, as: 'student', attributes: ['id', 'fullName', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5,
      });
      // Top performing internships by application count
      const topInternships = await db.Internship.findAll({
        where: { companyId: user.id },
        attributes: [
          'id',
          'title',
          [db.sequelize.literal(`(
            SELECT COUNT(*)
            FROM applications AS a
            WHERE a.internship_id = Internship.id
          )`), 'applicationCount']
        ],
        order: [[db.sequelize.literal('applicationCount'), 'DESC']],
        limit: 5,
      });
      res.json({
        success: true,
        data: {
          totalInternships,
          activeInternships,
          totalApplications,
          hiredInterns,
          pendingApplications,
          hiringRate,
          recentApplications,
          topInternships
        }
      });
    } catch (error) {
      logger.error('Get company analytics error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch company analytics' });
    }
  },

  getPlatformAnalytics: async (req, res) => {
    try {
      // Top-level counts
      const totalUsers = await db.User.count();
      const totalInternships = await db.Internship.count();
      const totalApplications = await db.Application.count();

      // User role distribution
      const userRoleStats = await db.User.findAll({
        attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['role'],
      });

      // Application status distribution
      const applicationStats = await db.Application.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
      });

      // Internship categories
      const categoryStats = await db.Internship.findAll({
        attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['category'],
      });

      // Internship types
      const typeStats = await db.Internship.findAll({
        attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['type'],
      });

      // Internship locations
      const locationStats = await db.Internship.findAll({
        attributes: ['location', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['location'],
      });

      // Monthly internship posting trends
      const monthlyTrends = await db.Internship.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'ASC']],
      });

      // Monthly application trends
      const monthlyApplications = await db.Application.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'ASC']],
      });

      // Recent users
      const recentUsers = await db.User.findAll({
        attributes: ['id', 'fullName', 'email', 'role', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 5,
      });

      // Top internships by application count
      const topInternships = await db.Internship.findAll({
        attributes: [
          'id',
          'title',
          [sequelize.literal(`(
            SELECT COUNT(*)
            FROM applications AS a
            WHERE a.internship_id = Internship.id AND a.deleted_at IS NULL
          )`), 'applicationCount'],
        ],
        where: { deleted_at: null },
        order: [[sequelize.literal('applicationCount'), 'DESC']],
        limit: 5,
      });

      res.json({
        success: true,
        data: {
          overview: { totalUsers, totalInternships, totalApplications },
          userRoleStats,
          applicationStats,
          categoryStats,
          typeStats,
          locationStats,
          monthlyTrends,
          monthlyApplications,
          recentUsers,
          topInternships
        }
      });
    } catch (error) {
      logger.error('Get platform analytics error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch platform analytics' });
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

module.exports = analyticsController;
