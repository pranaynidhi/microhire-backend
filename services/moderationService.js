const User = require('../models/User');
const Internship = require('../models/Internship');
const Review = require('../models/Review');
const Report = require('../models/Report');
const Notification = require('../models/Notification');

class ModerationService {
  static async moderateContent(contentType, contentId, action, adminId, notes) {
    try {
      let content;
      let notificationData;

      switch (contentType) {
        case 'user':
          content = await User.findByPk(contentId);
          if (action === 'suspend') {
            await content.update({ isActive: false });
            notificationData = {
              userId: contentId,
              title: 'Account Suspended',
              message: 'Your account has been suspended by an administrator.',
              type: 'account_suspended'
            };
          }
          break;

        case 'internship':
          content = await Internship.findByPk(contentId);
          if (action === 'remove') {
            await content.update({ status: 'removed' });
            notificationData = {
              userId: content.companyId,
              title: 'Internship Removed',
              message: 'Your internship has been removed by an administrator.',
              type: 'internship_removed'
            };
          }
          break;

        case 'review':
          content = await Review.findByPk(contentId);
          if (action === 'remove') {
            await content.update({ isVisible: false });
            notificationData = {
              userId: content.reviewerId,
              title: 'Review Removed',
              message: 'Your review has been removed by an administrator.',
              type: 'review_removed'
            };
          }
          break;
      }

      // Create moderation log
      await ModerationLog.create({
        contentType,
        contentId,
        action,
        adminId,
        notes
      });

      // Send notification if needed
      if (notificationData) {
        await Notification.create(notificationData);
      }

      return content;
    } catch (error) {
      console.error('Moderate content error:', error);
      throw error;
    }
  }

  static async getModerationQueue() {
    try {
      const pendingReports = await Report.findAll({
        where: { status: 'pending' },
        include: [
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'fullName', 'email']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      const pendingReviews = await Review.findAll({
        where: { status: 'pending' },
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'fullName', 'email']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      return {
        reports: pendingReports,
        reviews: pendingReviews
      };
    } catch (error) {
      console.error('Get moderation queue error:', error);
      throw error;
    }
  }
}

module.exports = ModerationService;
