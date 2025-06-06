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

const trackUserSession = async (req, res, next) => {
  if (req.user) {
    const sessionId = req.headers['x-session-id'] || crypto.randomBytes(16).toString('hex');
    req.sessionId = sessionId;

    await Analytics.create({
      eventType: 'login',
      userId: req.user.id,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: getDeviceType(req.get('User-Agent')),
      browser: getBrowser(req.get('User-Agent')),
      os: getOS(req.get('User-Agent')),
      metadata: {
        path: req.path,
        method: req.method
      }
    });
  }
  next();
};

const trackPageView = async (req, res, next) => {
  if (req.user) {
    await Analytics.create({
      eventType: 'page_view',
      userId: req.user.id,
      sessionId: req.sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      metadata: {
        path: req.path,
        method: req.method,
        query: req.query
      }
    });
  }
  next();
};

// Helper functions for device detection
const getDeviceType = (userAgent) => {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

const getBrowser = (userAgent) => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  return 'Other';
};

const getOS = (userAgent) => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'MacOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios')) return 'iOS';
  return 'Other';
};

module.exports = {
  trackEvent,
  trackUserSession,
  trackPageView
};
