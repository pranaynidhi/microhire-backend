'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');
const basename = path.basename(__filename);
const { sequelize } = require('../config/database');
const setupAssociations = require('./associations');

const db = {};

// Get all model files
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1 &&
      file !== 'BaseModel.js' &&
      file !== 'associations.js'
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

console.log('\nSetting up model associations...');

// Second pass: Set up associations
Object.keys(db).forEach(modelName => {
  try {
    if (typeof db[modelName].associate === 'function') {
      console.log(`- Setting up associations for: ${modelName}`);
      db[modelName].associate(db);
    }
  } catch (error) {
    console.error(`❌ Error setting up associations for ${modelName}:`, error.message);
    throw error; // Stop execution on association error
  }
});

// Set up associations using our centralized associations file
console.log('\nSetting up centralized associations...');
try {
  setupAssociations(db);
  console.log('✓ Centralized associations set up successfully');
} catch (error) {
  console.error('❌ Error setting up centralized associations:', error.message);
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

    // Now that all tables exist, set up associations
    logger.info('Setting up model associations...');
    await setupAssociations(db);
    
    // Sync all models again to ensure associations are properly set
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
        await syncDatabase({ force: true });
        logger.info('Database synchronized successfully with force: true');
        
        // After syncing, set up model associations
        setupAssociations(db);
        
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
      await syncDatabase({ alter: true });
      setupAssociations(db);
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
