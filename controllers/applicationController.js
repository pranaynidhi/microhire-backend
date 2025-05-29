const { Application, Internship, User } = require('../models');

const createApplication = async (req, res) => {
  try {
    const { internshipId, coverLetter } = req.body;

    // Check if internship exists and is active
    const internship = await Internship.findByPk(internshipId);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.',
      });
    }

    if (internship.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This internship is no longer accepting applications.',
      });
    }

    if (new Date() > new Date(internship.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed.',
      });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      where: {
        internshipId,
        userId: req.user.id,
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this internship.',
      });
    }

    // Check if max applicants reached
    const applicationCount = await Application.count({
      where: { internshipId },
    });

    if (applicationCount >= internship.maxApplicants) {
      return res.status(400).json({
        success: false,
        message: 'Maximum number of applications reached for this internship.',
      });
    }

    // Create application
    const application = await Application.create({
      internshipId,
      userId: req.user.id,
      coverLetter,
    });

    await application.reload({
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
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: {
        application,
      },
    });
  } catch (error) {
    console.error('Create application error:', error);
    
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

const getApplicationsByInternship = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if internship exists and belongs to the user
    const internship = await Internship.findByPk(id);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.',
      });
    }

    if (internship.companyId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view applications for your own internships.',
      });
    }

    const applications = await Application.findAll({
      where: { internshipId: id },
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: [
            'id',
            'fullName',
            'email',
            'bio',
            'skills',
            'resumeUrl',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        applications,
        internship: {
          id: internship.id,
          title: internship.title,
        },
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

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, accepted, or rejected.',
      });
    }

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Internship,
          as: 'internship',
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    // Check if the internship belongs to the current user
    if (application.internship.companyId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update applications for your own internships.',
      });
    }

    await application.update({
      status,
      notes,
      reviewedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Application status updated successfully.',
      data: {
        application,
      },
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  createApplication,
  getApplicationsByInternship,
  updateApplicationStatus,
};
