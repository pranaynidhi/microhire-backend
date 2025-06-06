const sequelize = require('../config/database');
const User = require('./User');
const Internship = require('./Internship');
const Application = require('./Application');
const Notification = require('./Notification');
const Message = require('./Messages');
const File = require('./File');
const Review = require('./Review');
const Certificate = require('./Certificate');
const Analytics = require('./Analytics');
const Report = require('./Report');
// Define associations
User.hasMany(Internship, {
  foreignKey: 'companyId',
  as: 'internships', 
  onDelete: 'CASCADE',});

Internship.belongsTo(User, {
  foreignKey: 'companyId',
  as: 'company',
});

User.hasMany(Application, {
  foreignKey: 'userId',
  as: 'applications',
  onDelete: 'CASCADE',
});

Application.belongsTo(User, {
  foreignKey: 'userId',
  as: 'applicant',
});

Internship.hasMany(Application, {
  foreignKey: 'internshipId',
  as: 'applications',
  onDelete: 'CASCADE',
});

Application.belongsTo(Internship, {
  foreignKey: 'internshipId',
  as: 'internship',
});

// Message associations
User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'sentMessages',
  onDelete: 'CASCADE',
});

User.hasMany(Message, {
  foreignKey: 'receiverId',
  as: 'receivedMessages',
  onDelete: 'CASCADE',
});

Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender',
});

Message.belongsTo(User, {
  foreignKey: 'receiverId',
  as: 'receiver',
});

// Notification associations
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(File, {
  foreignKey: 'userId',
  as: 'files' 
});

File.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user' 
});
User.hasMany(Review, {
  foreignKey: 'reviewerId',
  as: 'givenReviews'
});

User.hasMany(Review, {
  foreignKey: 'revieweeId',
  as: 'receivedReviews'
});

Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'revieweeId', as: 'reviewee' });
Review.belongsTo(Internship, { foreignKey: 'internshipId', as: 'internship' });

User.hasMany(Certificate, { foreignKey: 'studentId', as: 'certificates' });
User.hasMany(Certificate, { foreignKey: 'companyId', as: 'issuedCertificates' });
Certificate.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Certificate.belongsTo(User, { foreignKey: 'companyId', as: 'company' });
Certificate.belongsTo(Internship, { foreignKey: 'internshipId', as: 'internship' });

User.hasMany(Analytics, { foreignKey: 'userId', as: 'analytics' });
Analytics.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Report, { foreignKey: 'reporterId', as: 'reportsMade' });
User.hasMany(Report, { foreignKey: 'reportedUserId', as: 'reportsReceived' });
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reportedUserId', as: 'reportedUser' });
Report.belongsTo(Internship, { foreignKey: 'reportedInternshipId', as: 'reportedInternship' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Add these indexes to the models

// User model indexes
User.addHook('afterSync', async () => {
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
    CREATE INDEX IF NOT EXISTS idx_users_is_active ON Users(isActive);
  `);
});

// Internship model indexes
Internship.addHook('afterSync', async () => {
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_internships_company ON Internships(companyId);
    CREATE INDEX IF NOT EXISTS idx_internships_status ON Internships(status);
    CREATE INDEX IF NOT EXISTS idx_internships_deadline ON Internships(deadline);
    CREATE INDEX IF NOT EXISTS idx_internships_category ON Internships(category);
  `);
});

// Application model indexes
Application.addHook('afterSync', async () => {
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_applications_student ON Applications(studentId);
    CREATE INDEX IF NOT EXISTS idx_applications_internship ON Applications(internshipId);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON Applications(status);
  `);
});

module.exports = {
  sequelize,
  User,
  Internship,
  Application,
  Message,
  Notification,
  File,
  Review,
  Certificate,
  Analytics,
  Report,
  syncDatabase,
};
