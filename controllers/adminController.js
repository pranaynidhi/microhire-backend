// controllers/adminController.js
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Report = require('../models/Report');
const { Op } = require('sequelize');

const adminController = {
  getUsers: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        role, 
        status, 
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (role) {
        whereClause.role = role;
      }

      if (status) {
        whereClause.isActive = status === 'active';
      }

      if (search) {
        whereClause[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { companyName: { [Op.like]: `%${search}%` } }
        ];
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(users.count / limit),
            totalItems: users.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { status, reason } = req.body;
      const userId = req.params.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ 
        isActive: status === 'active',
        adminNotes: reason 
      });

      res.json({
        success: true,
        message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        data: { user }
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  },

  getInternships: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const internships = await Internship.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'company',
          attributes: ['id', 'companyName', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          internships: internships.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(internships.count / limit),
            totalItems: internships.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get internships error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch internships'
      });
    }
  },

  moderateInternship: async (req, res) => {
    try {
      const { status, reason } = req.body;
      const internshipId = req.params.id;

      const internship = await Internship.findByPk(internshipId);
      if (!internship) {
        return res.status(404).json({
          success: false,
          message: 'Internship not found'
        });
      }

      await internship.update({ 
        status,
        adminNotes: reason 
      });

      res.json({
        success: true,
        message: `Internship ${status} successfully`,
        data: { internship }
      });
    } catch (error) {
      console.error('Moderate internship error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to moderate internship'
      });
    }
  },

  getReports: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status = 'pending',
        type 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { status };

      if (type) {
        whereClause.type = type;
      }

      const reports = await Report.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'fullName', 'email']
          },
          {
            model: User,
            as: 'reportedUser',
            attributes: ['id', 'fullName', 'email'],
            required: false
          },
          {
            model: Internship,
            as: 'reportedInternship',
            attributes: ['id', 'title'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          reports: reports.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(reports.count / limit),
            totalItems: reports.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports'
      });
    }
  },

  resolveReport: async (req, res) => {
    try {
      const { status, adminNotes, action } = req.body;
      const reportId = req.params.id;

      const report = await Report.findByPk(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Take action based on admin decision
      if (action === 'suspend_user' && report.reportedUserId) {
        await User.update(
          { isActive: false },
          { where: { id: report.reportedUserId } }
        );
      } else if (action === 'remove_internship' && report.reportedInternshipId) {
        await Internship.update(
          { status: 'closed' },
          { where: { id: report.reportedInternshipId } }
        );
      }

      await report.update({
        status,
        adminNotes,
        resolvedAt: new Date(),
        resolvedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Report resolved successfully',
        data: { report }
      });
    } catch (error) {
      console.error('Resolve report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve report'
      });
    }
  }
};

module.exports = adminController;
