const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const { User, Internship, Application, Review, sequelize } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
  // Track user activity
  static async trackUserActivity(userId, action, metadata = {}) {
    try {
      if (!userId || !action) {
        throw new AppError('Invalid tracking data', 400);
      }

      logger.info('User activity tracked:', {
        userId,
        action,
        metadata,
        timestamp: new Date()
      });

      // Store in database or analytics service
      // Implementation depends on your analytics storage solution
    } catch (error) {
      logger.error('Error tracking user activity:', error);
      throw error;
    }
  }

  // Get user analytics
  static async getUserAnalytics(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const [applications, reviews] = await Promise.all([
        Application.findAll({ where: { userId } }),
        Review.findAll({ where: { userId } })
      ]);

      return {
        totalApplications: applications.length,
        acceptedApplications: applications.filter(app => app.status === 'accepted').length,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
          : 0
      };
    } catch (error) {
      logger.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Get company analytics
  static async getCompanyAnalytics(companyId) {
    try {
      const company = await User.findOne({ 
        where: { 
          id: companyId, 
          role: 'company' 
        }
      });
      
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      const [internships, applications, reviews] = await Promise.all([
        Internship.findAll({ where: { companyId } }),
        Application.findAll({ 
          where: { companyId },
          include: [{ model: Internship, where: { companyId } }]
        }),
        Review.findAll({ 
          where: { companyId },
          include: [{ model: Internship, where: { companyId } }]
        })
      ]);

      return {
        totalInternships: internships.length,
        activeInternships: internships.filter(internship => internship.status === 'open').length,
        totalApplications: applications.length,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
          : 0
      };
    } catch (error) {
      logger.error('Error getting company analytics:', error);
      throw error;
    }
  }

  // Get platform analytics
  static async getPlatformAnalytics() {
    try {
      const [
        totalUsers,
        totalCompanies,
        totalInternships,
        totalApplications,
        totalReviews
      ] = await Promise.all([
        User.count({ where: { role: 'student' } }),
        User.count({ where: { role: 'company' } }),
        Internship.count(),
        Application.count(),
        Review.count()
      ]);

      const averageRating = await Review.findAll({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
        ],
        raw: true
      });

      return {
        totalUsers,
        totalCompanies,
        totalInternships,
        totalApplications,
        totalReviews,
        averageRating: parseFloat(averageRating[0]?.averageRating) || 0
      };
    } catch (error) {
      logger.error('Error getting platform analytics:', error);
      throw error;
    }
  }

  // Export analytics data
  static async exportAnalyticsData(format = 'json') {
    try {
      const data = await this.getPlatformAnalytics();

      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(data, null, 2);
        case 'csv':
          // Implement CSV conversion
          throw new AppError('CSV export not implemented', 501);
        default:
          throw new AppError('Unsupported export format', 400);
      }
    } catch (error) {
      logger.error('Error exporting analytics data:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService; 