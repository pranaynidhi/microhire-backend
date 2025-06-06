const { User, Internship, Application } = require('../models');

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile(),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
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
    console.error('Update profile error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
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
      return res.status(403).json({
        success: false,
        message: 'Only students can view applications.',
      });
    }

    const applications = await Application.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Internship,
          as: 'internship',
          include: [
            {
              model: User,
              as: 'company',
              attributes: ['id', 'companyName', 'email'],
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
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getMyInternships = async (req, res) => {
  try {
    if (req.user.role !== 'business') {
      return res.status(403).json({
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
              as: 'applicant',
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
    console.error('Get internships error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    await User.update(
      { fcmToken },
      { where: { id: userId } }
    );

    res.json({
      success: true,
      message: 'FCM token updated successfully',
    });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FCM token',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMyApplications,
  getMyInternships,
  updateFCMToken,
};
