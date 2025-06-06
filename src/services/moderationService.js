const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const { User, Internship, Review, Report } = require('../models');

class ModerationService {
  // Report content
  static async reportContent(userId, contentId, contentType, reason, details) {
    try {
      if (!userId || !contentId || !contentType || !reason) {
        throw new AppError('Missing required fields', 400);
      }

      // Validate content type
      const validContentTypes = ['internship', 'review', 'user'];
      if (!validContentTypes.includes(contentType)) {
        throw new AppError('Invalid content type', 400);
      }

      // Check if content exists
      let content;
      switch (contentType) {
        case 'internship':
          content = await Internship.findById(contentId);
          break;
        case 'review':
          content = await Review.findById(contentId);
          break;
        case 'user':
          content = await User.findById(contentId);
          break;
      }

      if (!content) {
        throw new AppError('Content not found', 404);
      }

      // Create report
      const report = await Report.create({
        reporterId: userId,
        contentId,
        contentType,
        reason,
        details,
        status: 'pending'
      });

      logger.info('Content reported:', {
        reportId: report._id,
        contentType,
        contentId,
        reason
      });

      return report;
    } catch (error) {
      logger.error('Error reporting content:', error);
      throw error;
    }
  }

  // Review report
  static async reviewReport(reportId, moderatorId, action, notes) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new AppError('Report not found', 404);
      }

      if (report.status !== 'pending') {
        throw new AppError('Report already reviewed', 400);
      }

      // Update report status
      report.status = 'reviewed';
      report.moderatorId = moderatorId;
      report.action = action;
      report.notes = notes;
      report.reviewedAt = new Date();
      await report.save();

      // Take action based on moderator's decision
      if (action === 'remove') {
        await this.removeContent(report.contentId, report.contentType);
      } else if (action === 'warn') {
        await this.warnUser(report.contentId, report.contentType, notes);
      }

      logger.info('Report reviewed:', {
        reportId,
        action,
        moderatorId
      });

      return report;
    } catch (error) {
      logger.error('Error reviewing report:', error);
      throw error;
    }
  }

  // Remove content
  static async removeContent(contentId, contentType) {
    try {
      let content;
      switch (contentType) {
        case 'internship':
          content = await Internship.findById(contentId);
          if (content) {
            content.status = 'removed';
            await content.save();
          }
          break;
        case 'review':
          content = await Review.findById(contentId);
          if (content) {
            content.status = 'removed';
            await content.save();
          }
          break;
        case 'user':
          content = await User.findById(contentId);
          if (content) {
            content.status = 'suspended';
            await content.save();
          }
          break;
      }

      if (!content) {
        throw new AppError('Content not found', 404);
      }

      logger.info('Content removed:', {
        contentType,
        contentId
      });
    } catch (error) {
      logger.error('Error removing content:', error);
      throw error;
    }
  }

  // Warn user
  static async warnUser(userId, contentType, reason) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Add warning to user's record
      user.warnings.push({
        type: contentType,
        reason,
        date: new Date()
      });

      // Check if user should be suspended
      if (user.warnings.length >= 3) {
        user.status = 'suspended';
      }

      await user.save();

      logger.info('User warned:', {
        userId,
        contentType,
        reason
      });
    } catch (error) {
      logger.error('Error warning user:', error);
      throw error;
    }
  }

  // Get pending reports
  static async getPendingReports(page = 1, limit = 10) {
    try {
      const reports = await Report.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reporterId', 'name email')
        .populate('contentId');

      const total = await Report.countDocuments({ status: 'pending' });

      return {
        reports,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting pending reports:', error);
      throw error;
    }
  }
}

module.exports = ModerationService; 