const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Ensure upload directories exist
const uploadDirs = ['uploads/resumes', 'uploads/logos', 'uploads/portfolios'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'resume') {
      uploadPath += 'resumes/';
    } else if (file.fieldname === 'logo') {
      uploadPath += 'logos/';
    } else if (file.fieldname === 'portfolio') {
      uploadPath += 'portfolios/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  try {
    // Define allowed file types
    const allowedMimeTypes = {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    };

    // Check file type
    if (!allowedMimeTypes[file.mimetype]) {
      return cb(new AppError('Invalid file type', 400), false);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes[file.mimetype].includes(ext)) {
      return cb(new AppError('Invalid file extension', 400), false);
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return cb(new AppError('File size too large. Maximum size is 5MB', 400), false);
    }

    cb(null, true);
  } catch (error) {
    logger.error('Error in file filter:', error);
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Upload middleware
const uploadMiddleware = (fieldName) => {
  return async (req, res, next) => {
    try {
      // Handle single file upload
      upload.single(fieldName)(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return next(new AppError('File size too large. Maximum size is 5MB', 400));
            }
            return next(new AppError(err.message, 400));
          }
          return next(err);
        }

        if (!req.file) {
          return next(new AppError('No file uploaded', 400));
        }

        // Add file information to request
        req.fileInfo = {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        };

        next();
      });
    } catch (error) {
      logger.error('Error in upload middleware:', error);
      next(error);
    }
  };
};

// Delete file middleware
const deleteFileMiddleware = async (req, res, next) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return next(new AppError('Filename is required', 400));
    }

    const filePath = path.join('uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filePath}`);
    } else {
      logger.warn(`File not found: ${filePath}`);
    }

    next();
  } catch (error) {
    logger.error('Error in delete file middleware:', error);
    next(error);
  }
};

// Cleanup old files
const cleanupOldFiles = async () => {
  try {
    for (const dir of uploadDirs) {
      const files = await fs.promises.readdir(dir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);
        
        // Remove files older than 24 hours
        if (now - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
          await fs.promises.unlink(filePath);
          logger.info(`Cleaned up old file: ${filePath}`);
        }
      }
    }
  } catch (error) {
    logger.error('File cleanup error:', error);
  }
};

// Run cleanup every 24 hours
setInterval(cleanupOldFiles, 24 * 60 * 60 * 1000);

module.exports = {
  uploadMiddleware,
  deleteFileMiddleware
};
