const File = require('../models/File');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const uploadController = {
  uploadResume: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Delete previous resume if exists
      const existingResume = await File.findOne({
        where: { userId: req.user.id, type: 'resume', isActive: true }
      });

      if (existingResume) {
        // Delete physical file
        if (fs.existsSync(existingResume.path)) {
          fs.unlinkSync(existingResume.path);
        }
        await existingResume.update({ isActive: false });
      }

      const file = await File.create({
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        type: 'resume',
        userId: req.user.id
      });

      // Update user's resumeUrl
      await User.update(
        { resumeUrl: `/uploads/resumes/${req.file.filename}` },
        { where: { id: req.user.id } }
      );

      res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: { file }
      });
    } catch (error) {
      console.error('Upload resume error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload resume'
      });
    }
  },

  uploadLogo: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      if (req.user.role !== 'business') {
        return res.status(403).json({
          success: false,
          message: 'Only businesses can upload logos'
        });
      }

      // Delete previous logo if exists
      const existingLogo = await File.findOne({
        where: { userId: req.user.id, type: 'logo', isActive: true }
      });

      if (existingLogo) {
        if (fs.existsSync(existingLogo.path)) {
          fs.unlinkSync(existingLogo.path);
        }
        await existingLogo.update({ isActive: false });
      }

      const file = await File.create({
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        type: 'logo',
        userId: req.user.id
      });

      // Update user's logoUrl
      await User.update(
        { logoUrl: `/uploads/logos/${req.file.filename}` },
        { where: { id: req.user.id } }
      );

      res.status(201).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: { file }
      });
    } catch (error) {
      console.error('Upload logo error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload logo'
      });
    }
  },

  uploadPortfolio: async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const files = [];
      for (const file of req.files) {
        const createdFile = await File.create({
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          type: 'portfolio',
          userId: req.user.id
        });
        files.push(createdFile);
      }

      res.status(201).json({
        success: true,
        message: 'Portfolio files uploaded successfully',
        data: { files }
      });
    } catch (error) {
      console.error('Upload portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload portfolio files'
      });
    }
  },

  deleteFile: async (req, res) => {
    try {
      const file = await File.findOne({
        where: { 
          id: req.params.fileId, 
          userId: req.user.id,
          isActive: true 
        }
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Delete physical file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      await file.update({ isActive: false });

      // Update user fields if necessary
      if (file.type === 'resume') {
        await User.update(
          { resumeUrl: null },
          { where: { id: req.user.id } }
        );
      } else if (file.type === 'logo') {
        await User.update(
          { logoUrl: null },
          { where: { id: req.user.id } }
        );
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
  },

  getUserFiles: async (req, res) => {
    try {
      const files = await File.findAll({
        where: { 
          userId: req.user.id,
          isActive: true
        },
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { files }
      });
    } catch (error) {
      console.error('Get user files error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user files'
      });
    }
  }
};

module.exports = uploadController;
