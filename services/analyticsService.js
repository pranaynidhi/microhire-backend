const Analytics = require('../models/Analytics');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class AnalyticsService {
  static async trackEvent(eventData) {
    try {
      await Analytics.create(eventData);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  static async getRealTimeStats() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

      const activeUsers = await Analytics.findAll({
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'eventCount']
        ],
        where: {
          createdAt: {
            [Op.gte]: fiveMinutesAgo
          }
        },
        group: ['userId']
      });

      const eventTypes = await Analytics.findAll({
        attributes: [
          'eventType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: fiveMinutesAgo
          }
        },
        group: ['eventType']
      });

      return {
        activeUsers: activeUsers.length,
        eventTypes
      };
    } catch (error) {
      console.error('Get real-time stats error:', error);
      throw error;
    }
  }

  static async getCustomDateRangeStats(startDate, endDate) {
    try {
      const stats = await Analytics.findAll({
        attributes: [
          'eventType',
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['eventType', sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      return stats;
    } catch (error) {
      console.error('Get custom date range stats error:', error);
      throw error;
    }
  }

  static async exportAnalytics(startDate, endDate, format = 'csv') {
    try {
      const analytics = await Analytics.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'role']
        }],
        order: [['createdAt', 'ASC']]
      });

      if (format === 'csv') {
        return this.convertToCSV(analytics);
      } else if (format === 'json') {
        return analytics;
      }
    } catch (error) {
      console.error('Export analytics error:', error);
      throw error;
    }
  }

  static convertToCSV(analytics) {
    const headers = [
      'Event Type',
      'User ID',
      'User Name',
      'User Email',
      'User Role',
      'IP Address',
      'User Agent',
      'Device Type',
      'Browser',
      'OS',
      'Timestamp',
      'Metadata'
    ];

    const rows = analytics.map(record => [
      record.eventType,
      record.userId,
      record.user?.fullName || '',
      record.user?.email || '',
      record.user?.role || '',
      record.ipAddress,
      record.userAgent,
      record.deviceType,
      record.browser,
      record.os,
      record.createdAt,
      JSON.stringify(record.metadata)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = AnalyticsService;
