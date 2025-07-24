'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');
const basename = path.basename(__filename);
const { sequelize } = require('../config/database');

const db = {};

// Get all model files
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && // Skip hidden files
      file !== basename && // Skip this file
      file.slice(-3) === '.js' && // Only .js files
      file.indexOf('.test.js') === -1 && // Skip test files
      file.indexOf('.bak') === -1 && // Skip backup files
      file !== 'BaseModel.js' && // Skip base model
      file !== 'associations.js' // Skip associations file
    );
  });

console.log(`\nLoading ${modelFiles.length} models...`);

// First pass: Initialize all models
modelFiles.forEach(file => {
  try {
    console.log(`- Loading model: ${file}`);
    
    // Import the model function
    const modelModule = require(path.join(__dirname, file));
    
    if (typeof modelModule !== 'function') {
      throw new Error(`Model ${file} does not export a function`);
    }
    
    // Initialize the model
    const model = modelModule(sequelize, DataTypes);
    
    if (!model || !model.name) {
      throw new Error(`Model ${file} did not return a valid model instance`);
    }
    
    // Add to db object
    db[model.name] = model;
    console.log(`  ✓ Loaded model: ${model.name}`);
    
  } catch (error) {
    console.error(`❌ Error loading model ${file}:`, error.message);
    throw error; // Stop execution on model loading error
  }
});

// Set up model associations
console.log('\nSetting up model associations...');
try {
  // ======================
  // User Associations
  // ======================
  // Note: blacklistedTokens association is defined in the User model
  
  // User as company posting internships
  db.User.hasMany(db.Internship, {
    foreignKey: 'companyId',
  });
  
  // User as student applying to internships
  db.User.hasMany(db.Internship, {
    foreignKey: 'studentId',
    as: 'appliedInternships'
  });
  
  // User's applications
  db.User.hasMany(db.Application, {
    foreignKey: 'studentId',
    as: 'applications'
  });
  
  // User's bookmarks
  db.User.hasMany(db.Bookmark, {
    foreignKey: 'userId',
    as: 'bookmarks'
  });
  
  // User's certificates
  db.User.hasMany(db.Certificate, {
    foreignKey: 'studentId',
    as: 'certificates'
  });
  
  // User's certificate views
  db.User.hasMany(db.CertificateView, {
    foreignKey: 'viewerId',
    as: 'certificateViews'
  });
  
  // User's conversations (as participant1 or participant2)
  db.User.hasMany(db.Conversation, {
    foreignKey: 'participant1Id',
    as: 'initiatedConversations'
  });
  
  db.User.hasMany(db.Conversation, {
    foreignKey: 'participant2Id',
    as: 'receivedConversations'
  });
  
  // User's files
  db.User.hasMany(db.File, {
    foreignKey: 'uploadedById',
    as: 'uploadedFiles'
  });
  
  // User's interviews (as interviewer or interviewee)
  db.User.hasMany(db.Interview, {
    foreignKey: 'interviewerId',
    as: 'interviewsAsInterviewer'
  });
  
  db.User.hasMany(db.Interview, {
    foreignKey: 'intervieweeId',
    as: 'interviewsAsInterviewee'
  });
  
  // User's notifications
  db.User.hasMany(db.Notification, {
    foreignKey: 'userId',
    as: 'notifications'
  });
  
  // User's reports (as reporter)
  db.User.hasMany(db.Report, {
    foreignKey: 'reporterId',
    as: 'reports'
  });
  
  // User's reviews (as reviewer or reviewee)
  db.User.hasMany(db.Review, {
    foreignKey: 'reviewerId',
    as: 'reviewsGiven'
  });
  
  db.User.hasMany(db.Review, {
    foreignKey: 'revieweeId',
    as: 'reviewsReceived'
  });
  
  // User's search history
  db.User.hasMany(db.SearchHistory, {
    foreignKey: 'userId',
    as: 'searchHistory'
  });
  
  // User's analytics events
  db.User.hasMany(db.Analytics, {
    foreignKey: 'userId',
    as: 'analyticsEvents'
  });

  // ======================
  // BlacklistedToken Associations
  // ======================
  db.BlacklistedToken.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // ======================
  // Internship Associations
  // ======================
  db.Internship.belongsTo(db.User, {
    foreignKey: 'companyId',
    as: 'company'
  });
  
  db.Internship.belongsTo(db.User, {
    foreignKey: 'studentId',
    as: 'student'
  });
  
  db.Internship.hasMany(db.Application, {
    foreignKey: 'internshipId',
    as: 'applications'
  });
  
  db.Internship.hasMany(db.Bookmark, {
    foreignKey: 'internshipId',
    as: 'bookmarks'
  });
  
  db.Internship.hasMany(db.Review, {
    foreignKey: 'internshipId',
    as: 'reviews'
  });

  // ======================
  // Application Associations
  // ======================
  db.Application.belongsTo(db.Internship, {
    foreignKey: 'internshipId',
    as: 'internship'
  });
  
  db.Application.belongsTo(db.User, {
    foreignKey: 'studentId',
    as: 'student'
  });
  
  db.Application.belongsTo(db.User, {
    foreignKey: 'reviewedBy',
    as: 'reviewer'
  });

  // ======================
  // Bookmark Associations
  // ======================
  db.Bookmark.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'bookmarkUser'
  });
  
  db.Bookmark.belongsTo(db.Internship, {
    foreignKey: 'internshipId',
    as: 'internship'
  });

  // ======================
  // Certificate Associations
  // ======================
  db.Certificate.belongsTo(db.User, {
    foreignKey: 'studentId',
    as: 'student'
  });
  
  db.Certificate.belongsTo(db.Internship, {
    foreignKey: 'internshipId',
    as: 'internship'
  });
  
  db.Certificate.hasMany(db.CertificateView, {
    foreignKey: 'certificateId',
    as: 'views'
  });

  // ======================
  // CertificateView Associations
  // ======================
  db.CertificateView.belongsTo(db.Certificate, {
    foreignKey: 'certificateId',
    as: 'certificate'
  });
  
  db.CertificateView.belongsTo(db.User, {
    foreignKey: 'viewerId',
    as: 'viewer'
  });

  // ======================
  // Conversation Associations
  // ======================
  db.Conversation.belongsTo(db.User, {
    foreignKey: 'participant1Id',
    as: 'participant1'
  });
  
  db.Conversation.belongsTo(db.User, {
    foreignKey: 'participant2Id',
    as: 'participant2'
  });
  
  db.Conversation.hasMany(db.Message, {
    foreignKey: 'conversationId',
    as: 'messages'
  });

  // ======================
  // File Associations
  // ======================
  db.File.belongsTo(db.User, {
    foreignKey: 'uploadedById',
    as: 'uploadedBy'
  });

  // ======================
  // Interview Associations
  // ======================
  db.Interview.belongsTo(db.User, {
    foreignKey: 'interviewerId',
    as: 'interviewer'
  });
  
  db.Interview.belongsTo(db.User, {
    foreignKey: 'intervieweeId',
    as: 'interviewee'
  });
  
  db.Interview.belongsTo(db.Application, {
    foreignKey: 'applicationId',
    as: 'application'
  });

  // ======================
  // Message Associations
  // ======================
  db.Message.belongsTo(db.Conversation, {
    foreignKey: 'conversationId',
    as: 'conversation'
  });
  
  db.Message.belongsTo(db.User, {
    foreignKey: 'senderId',
    as: 'sender'
  });

  db.Message.belongsTo(db.User, {
    foreignKey: 'receiverId',
    as: 'receiver'
  });

  // ======================
  // Notification Associations
  // ======================
  db.Notification.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'notificationUser'
  });

  // ======================
  // Report Associations
  // ======================
  db.Report.belongsTo(db.User, {
    foreignKey: 'reporterId',
    as: 'reporter'
  });
  
  db.Report.belongsTo(db.User, {
    foreignKey: 'reportedUserId',
    as: 'reportedUser'
  });
  
  db.Report.belongsTo(db.Review, {
    foreignKey: 'reviewId',
    as: 'review'
  });

  // ======================
  // Review Associations
  // ======================
  db.Review.belongsTo(db.User, {
    foreignKey: 'reviewerId',
    as: 'reviewer'
  });
  
  db.Review.belongsTo(db.User, {
    foreignKey: 'revieweeId',
    as: 'reviewee'
  });
  
  db.Review.belongsTo(db.Internship, {
    foreignKey: 'internshipId',
    as: 'internship'
  });
  
  db.Review.hasMany(db.ReviewReport, {
    foreignKey: 'reviewId',
    as: 'reports'
  });

  // ======================
  // ReviewReport Associations
  // ======================
  db.ReviewReport.belongsTo(db.Review, {
    foreignKey: 'reviewId',
    as: 'review'
  });
  
  db.ReviewReport.belongsTo(db.User, {
    foreignKey: 'reporterId',
    as: 'reporter'
  });

  // ======================
  // SearchHistory Associations
  // ======================
  db.SearchHistory.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'searchUser'
  });

  // ======================
  // Analytics Associations
  // ======================
  db.Analytics.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'analyticsUser'
  });

  console.log('✓ Model associations set up successfully');
} catch (error) {
  console.error('❌ Error setting up model associations:', error.message);
  throw error;
}

// Add models to exports
db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log('\n✅ Database models loaded successfully!\n');

// Database synchronization function with ordered table creation
const syncDatabase = async (options = {}) => {
  const syncOptions = {
    force: false,
    alter: process.env.NODE_ENV !== 'production',
    ...options
  };

  // If not forcing sync, just do a regular sync
  if (!syncOptions.force) {
    await sequelize.sync(syncOptions);
    logger.info('Database synchronized successfully');
    return true;
  }

  // For force sync, we need to handle table creation order
  try {
    // First, drop all tables
    await sequelize.dropAllSchemas();
    logger.info('Dropped all schemas');

    // Then create tables in the correct order to satisfy foreign key constraints
    // Start with models that have no dependencies, then work our way up
    const modelOrder = [
      'User',                    // Base model with no foreign keys
      'SystemSettings',          // Independent settings
      'File',                    // Depends on User
      'Internship',              // Depends on User (company)
      'Application',             // Depends on User (student) and Internship
      'Review',                  // Depends on User (reviewer and reviewee) and Internship
      'ReviewReport',            // Depends on Review and User
      'Certificate',             // Depends on User (student) and Internship
      'CertificateView',         // Depends on Certificate and User
      'Conversation',            // Depends on User (participants)
      'Message',                 // Depends on Conversation and User
      'Notification',            // Depends on User
      'Bookmark',                // Depends on User and Internship
      'SearchHistory',           // Depends on User
      'Analytics',               // Depends on User
      'Report',                  // Depends on User
      'BlacklistedToken'         // Depends on User
    ];

    // Create each model's table individually
    for (const modelName of modelOrder) {
      if (db[modelName]) {
        logger.info(`Creating table for model: ${modelName}`);
        await db[modelName].sync({ force: true });
      } else {
        logger.warn(`Model ${modelName} not found in db object`);
      }
    }

    // Associations are already set up at the module level
    // Just sync the models to ensure associations are properly set
    await sequelize.sync({ alter: true });
    
    logger.info('Database synchronized successfully with ordered table creation');
    return true;
  } catch (error) {
    logger.error('Database synchronization failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

// Initialize database connection
const initializeDatabase = async () => {
  try {
    // First, ensure the database exists
    try {
      await sequelize.authenticate();
      logger.info('Database connection has been established successfully.');
    } catch (error) {
      logger.error('Failed to connect to the database. Please ensure the database exists and the credentials are correct.');
      throw error;
    }
    
    // Sync database based on environment
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      logger.info(`Syncing database in ${process.env.NODE_ENV} mode with force:true...`);
      try {
        // Use force:true to drop and recreate all tables
        logger.info('Dropping and recreating all tables...');
        // Associations are already set up at the module level
        await syncDatabase({ force: true });
        logger.info('Database synchronized successfully with force: true');
        
        // Create admin user and seed data in development
        if (process.env.NODE_ENV === 'development') {
          await ensureAdminAccount();
          // Run seed data if in development
          try {
            const seedDatabase = require('../utils/seed');
            await seedDatabase();
            logger.info('Development seed data created successfully');
          } catch (seedError) {
            logger.error('Error seeding development data:', seedError);
            // Don't throw error for seed failure, as the app can still run
          }
        }
        
        return true;
      } catch (syncError) {
        logger.error('Failed to sync database:', syncError);
        throw syncError;
      }
    } else {
      // In production, just sync without dropping tables
      logger.info('Syncing database in production mode with alter:true...');
      // Associations are already set up at the module level
      await syncDatabase({ alter: true });
      return true;
    }
  } catch (error) {
    logger.error('Database initialization failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

// Ensure admin account exists
const ensureAdminAccount = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@microhire.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Nidhi@7733';
    
    const [admin] = await db.User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        fullName: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        emailVerified: true,
        isActive: true
      }
    });
    
    if (admin) {
      logger.info('Admin user ensured');
    }
    
    return admin;
  } catch (error) {
    logger.error('Error ensuring admin account:', error);
    throw error;
  }
};

// Add utility functions to exports
db.syncDatabase = syncDatabase;
db.initializeDatabase = initializeDatabase;
db.ensureAdminAccount = ensureAdminAccount;

module.exports = db;
