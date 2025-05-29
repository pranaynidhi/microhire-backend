
const Analytics = require('../models/Analytics');

const trackEvent = (eventType) => {
  return async (req, res, next) => {
    try {
      const analyticsData = {
        eventType,
        userId: req.user ? req.user.id : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          path: req.path,
          method: req.method,
          query: req.query,
          timestamp: new Date()
        }
      };

      // Add specific metadata based on event type
      if (eventType === 'internship_posted' && req.body) {
        analyticsData.metadata.internshipData = {
          title: req.body.title,
          category: req.body.category,
          type: req.body.type,
          location: req.body.location
        };
      }

      if (eventType === 'application_submitted' && req.body) {
        analyticsData.targetId = req.body.internshipId;
      }

      await Analytics.create(analyticsData);
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't fail the request if analytics fails
    }
    next();
  };
};

module.exports = { trackEvent };
