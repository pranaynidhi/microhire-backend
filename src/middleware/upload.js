const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileType = require('file-type');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Ensure upload directories exist
const uploadDirs = ['uploads/resumes', 'uploads/logos', 'uploads/portfolios'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File type validation
const allowedTypes = {
  resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  logo: ['image/jpeg', 'image/png', 'image/gif'],
  portfolio: ['application/pdf', 'application/zip', 'image/jpeg', 'image/png']
};

const fileExtensions = {
  resume: ['.pdf', '.doc', '.docx'],
  logo: ['.jpg', '.jpeg', '.png', '.gif'],
  portfolio: ['.pdf', '.jpg', '.jpeg', '.png', '.zip']
};

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

const fileFilter = async (req, file, cb) => {
  try {
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const fieldAllowedTypes = fileExtensions[file.fieldname] || [];
    
    if (!fieldAllowedTypes.includes(ext)) {
      return cb(new AppError(`Invalid file type for ${file.fieldname}. Allowed: ${fieldAllowedTypes.join(', ')}`), false);
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return cb(new AppError('File size too large. Maximum size is 5MB'), false);
    }

    // Check MIME type
    const fileType = await FileType.fromBuffer(file.buffer);
    const allowedMimeTypes = allowedTypes[file.fieldname] || [];
    
    if (!allowedMimeTypes.includes(fileType.mime)) {
      return cb(new AppError(`Invalid file type for ${file.fieldname}`), false);
    }

    cb(null, true);
  } catch (error) {
    logger.error('File validation error:', error);
    cb(new AppError('Error validating file'), false);
  }
};

// Cleanup old files
const cleanupOldFiles = async () => {
  try {
    const files = await fs.promises.readdir('uploads');
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join('uploads', file);
      const stats = await fs.promises.stat(filePath);
      
      // Remove files older than 24 hours
      if (now - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
        await fs.promises.unlink(filePath);
        logger.info(`Cleaned up old file: ${filePath}`);
      }
    }
  } catch (error) {
    logger.error('File cleanup error:', error);
  }
};

// Run cleanup every 24 hours
setInterval(cleanupOldFiles, 24 * 60 * 60 * 1000);

const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next(error);
};

module.exports = {
  uploadMiddleware,
  handleUploadError
};
