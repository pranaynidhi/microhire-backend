const { User, Internship, Application, Message, Notification, Review } = require('../models');
const logger = require('../utils/logger');
const sessionUtil = require('../utils/session');
const Joi = require('joi');

function filterUserProfileForPublic(user) {
  // Only show public fields if profileVisibility is not 'public'
  const publicFields = [
    'id', 'fullName', 'role', 'profilePicture', 'bio', 'skills', 'location', 'profileVisibility', 'showOnlineStatus', 'createdAt'
  ];
  const filtered = {};
  for (const key of publicFields) {
    filtered[key] = user[key];
  }
  // Hide online status if showOnlineStatus is false
  if (!user.showOnlineStatus) {
    filtered.onlineStatus = undefined;
  } else {
    filtered.onlineStatus = 'online'; // or actual status if tracked
  }
  return filtered;
}

const getProfile = (req, res) => {
  try {
    const user = req.user.getPublicProfile();
    // If the request is for the current user, return full profile
    if (req.user.id === req.authenticatedUserId || req.isSelf) {
      return res.json({
        success: true,
        data: { user },
      });
    }
    // Otherwise, enforce privacy settings
    if (user.profileVisibility !== 'public') {
      return res.json({
        success: true,
        data: { user: filterUserProfileForPublic(user) },
      });
    }
    // If public, return full profile
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    // Validation schema for settings fields
    const schema = Joi.object({
      fullName: Joi.string().min(2).max(100),
      bio: Joi.string().allow('', null),
      skills: Joi.string().allow('', null),
      resumeUrl: Joi.string().uri().allow('', null),
      companyName: Joi.string().allow('', null),
      contactPerson: Joi.string().allow('', null),
      companyDescription: Joi.string().allow('', null),
      website: Joi.string().uri().allow('', null),
      phone: Joi.string().allow('', null),
      education: Joi.array(),
      emailNewInternships: Joi.boolean(),
      emailApplicationUpdates: Joi.boolean(),
      emailMessages: Joi.boolean(),
      emailMarketing: Joi.boolean(),
      pushMessages: Joi.boolean(),
      pushDeadlines: Joi.boolean(),
      profileVisibility: Joi.string().valid('public', 'companies', 'private'),
      showOnlineStatus: Joi.boolean(),
      searchEngineIndexing: Joi.boolean(),
      location: Joi.string().allow('', null),
      industry: Joi.string().allow('', null),
      companySize: Joi.string().allow('', null),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: error.details.map((err) => ({ field: err.path[0], message: err.message })),
      });
    }
    // Audit log for sensitive changes
    const sensitiveFields = ['profileVisibility', 'showOnlineStatus', 'searchEngineIndexing', 'emailNewInternships', 'emailApplicationUpdates', 'emailMessages', 'emailMarketing', 'pushMessages', 'pushDeadlines'];
    const changedFields = [];
    const changes = {};
    for (const field of sensitiveFields) {
      if (value[field] !== undefined && value[field] !== req.user[field]) {
        logger.info(`User ${req.user.id} changed ${field} from ${req.user[field]} to ${value[field]}`);
        changedFields.push(field);
        changes[field] = { from: req.user[field], to: value[field] };
      }
    }
    // Track settings change history
    if (changedFields.length > 0) {
      const history = req.user.settingsHistory || [];
      history.push({
        timestamp: new Date().toISOString(),
        changedFields,
        changes,
      });
      req.user.settingsHistory = history;
    }
    const {
      fullName,
      bio,
      skills,
      resumeUrl,
      companyName,
      contactPerson,
      companyDescription,
      website,
      phone,
      education,
      emailNewInternships,
      emailApplicationUpdates,
      emailMessages,
      emailMarketing,
      pushMessages,
      pushDeadlines,
      profileVisibility,
      showOnlineStatus,
      searchEngineIndexing,
      location,
      industry,
      companySize,
    } = value;
    const updateData = { fullName };
    if (req.user.role === 'student') {
      updateData.bio = bio;
      updateData.skills = skills;
      updateData.resumeUrl = resumeUrl;
      if (education !== undefined) updateData.education = education;
    } else if (req.user.role === 'business') {
      updateData.companyName = companyName;
      updateData.contactPerson = contactPerson;
      updateData.companyDescription = companyDescription;
      updateData.website = website;
      updateData.industry = industry;
      updateData.companySize = companySize;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (emailNewInternships !== undefined) updateData.emailNewInternships = emailNewInternships;
    if (emailApplicationUpdates !== undefined) updateData.emailApplicationUpdates = emailApplicationUpdates;
    if (emailMessages !== undefined) updateData.emailMessages = emailMessages;
    if (emailMarketing !== undefined) updateData.emailMarketing = emailMarketing;
    if (pushMessages !== undefined) updateData.pushMessages = pushMessages;
    if (pushDeadlines !== undefined) updateData.pushDeadlines = pushDeadlines;
    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (showOnlineStatus !== undefined) updateData.showOnlineStatus = showOnlineStatus;
    if (searchEngineIndexing !== undefined) updateData.searchEngineIndexing = searchEngineIndexing;
    if (location !== undefined) updateData.location = location;
    await req.user.update(updateData);
    await req.user.reload();
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: req.user.getPublicProfile(),
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      res.status(403).json({
        success: false,
        message: 'Only students can view applications.',
      });
    }

    const applications = await Application.findAll({
      where: { studentId: req.user.id },
      include: [
        {
          model: Internship,
          as: 'internship',
          include: [
            {
              model: User,
              as: 'company',
              attributes: ['id', 'fullName', 'email', 'role'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        applications,
      },
    });
  } catch (error) {
    logger.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getMyInternships = async (req, res) => {
  try {
    if (req.user.role !== 'business') {
      res.status(403).json({
        success: false,
        message: 'Only businesses can view posted internships.',
      });
    }

    const internships = await Internship.findAll({
      where: { companyId: req.user.id },
      include: [
        {
          model: Application,
          as: 'applications',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'fullName', 'email', 'bio', 'skills'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        internships,
      },
    });
  } catch (error) {
    logger.error('Get internships error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// Export user data as JSON
const exportUserData = async (req, res) => {
  try {
    const user = req.user.getPublicProfile();
    // Fetch related data
    const [applications, internships, messages, notifications, reviews] = await Promise.all([
      Application.findAll({ where: { studentId: user.id } }),
      Internship.findAll({ where: { companyId: user.id } }),
      Message.findAll({ where: { senderId: user.id } }),
      Notification.findAll({ where: { userId: user.id } }),
      Review.findAll({ where: { reviewerId: user.id } }),
    ]);
    const exportData = {
      user,
      applications,
      internships,
      messages,
      notifications,
      reviews,
    };
    res.setHeader('Content-Disposition', 'attachment; filename="user-data.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    logger.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// List active sessions from Redis
const getActiveSessions = async (req, res) => {
  try {
    const sessions = await sessionUtil.getSessionsByUser(req.user.id);
    res.json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    logger.error('Get active sessions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Revoke a session by sessionId from Redis
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await sessionUtil.removeSession(req.user.id, sessionId);
    res.json({
      success: true,
      message: `Session ${sessionId} revoked.`,
    });
  } catch (error) {
    logger.error('Revoke session error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMyApplications,
  getMyInternships,
  exportUserData,
  getActiveSessions,
  revokeSession,
};
