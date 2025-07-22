const { User, Internship, Application } = require('../models');
const logger = require('../utils/logger');

const getProfile = (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile(),
      },
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
    } = req.body;

    const updateData = { fullName };

    if (req.user.role === 'student') {
      updateData.bio = bio;
      updateData.skills = skills;
      updateData.resumeUrl = resumeUrl;
    } else if (req.user.role === 'business') {
      updateData.companyName = companyName;
      updateData.contactPerson = contactPerson;
      updateData.companyDescription = companyDescription;
      updateData.website = website;
      updateData.phone = phone;
    }

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

module.exports = {
  getProfile,
  updateProfile,
  getMyApplications,
  getMyInternships,
};
