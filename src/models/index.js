/* global console */
const { sequelize } = require('../config/database');
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
const ReviewReport = require('./ReviewReport');
const CertificateView = require('./CertificateView');
const SearchHistory = require('./SearchHistory');
const SystemSettings = require('./SystemSettings');
const Bookmark = require('./Bookmark');
const Interview = require('./Interview');
const Conversation = require('./Conversation');

// Define associations
User.hasMany(Internship, {
  foreignKey: 'companyId',
  as: 'internships',
  onDelete: 'CASCADE',
});

Internship.belongsTo(User, {
  foreignKey: 'companyId',
  as: 'company',
});

Internship.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
});

User.hasMany(Application, {
  foreignKey: 'studentId',
  as: 'applications',
  onDelete: 'CASCADE',
});

Application.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
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
  as: 'files',
});

File.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});
User.hasMany(Review, {
  foreignKey: 'reviewerId',
  as: 'givenReviews',
});

User.hasMany(Review, {
  foreignKey: 'revieweeId',
  as: 'receivedReviews',
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

// Bookmark associations
User.hasMany(Bookmark, {
  foreignKey: 'userId',
  as: 'bookmarks',
  onDelete: 'CASCADE',
});

Internship.hasMany(Bookmark, {
  foreignKey: 'internshipId',
  as: 'bookmarks',
  onDelete: 'CASCADE',
});

Bookmark.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Bookmark.belongsTo(Internship, {
  foreignKey: 'internshipId',
  as: 'internship',
});

// Interview associations
Application.hasMany(Interview, {
  foreignKey: 'applicationId',
  as: 'interviews',
  onDelete: 'CASCADE',
});

Interview.belongsTo(Application, {
  foreignKey: 'applicationId',
  as: 'application',
});

// Conversation associations
User.hasMany(Conversation, {
  foreignKey: 'participant1Id',
  as: 'conversationsAsParticipant1',
});

User.hasMany(Conversation, {
  foreignKey: 'participant2Id',
  as: 'conversationsAsParticipant2',
});

Conversation.belongsTo(User, {
  foreignKey: 'participant1Id',
  as: 'participant1',
});

Conversation.belongsTo(User, {
  foreignKey: 'participant2Id',
  as: 'participant2',
});

Conversation.belongsTo(Message, {
  foreignKey: 'lastMessageId',
  as: 'lastMessage',
});

Conversation.hasMany(Message, {
  foreignKey: 'conversationId',
  as: 'messages',
});

// Update Message associations to use conversationId
Message.belongsTo(Conversation, {
  foreignKey: 'conversationId',
  as: 'conversation',
});

// Sync database (for migrations)
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Use force: true to drop and recreate all tables
    // This resolves circular dependency issues during table creation
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    if (process.env.NODE_ENV === 'test') {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

// Initialize database connection (for server startup)
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Ensure admin account exists
    await ensureAdminAccount();
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// Ensure admin account exists
const ensureAdminAccount = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@microhire.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await User.findOne({
      where: {
        email: adminEmail,
        role: 'admin',
      },
    });

    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      await User.create({
        fullName: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
        isActive: true,
        companyName: 'MicroHire Platform',
        contactPerson: 'System Admin',
        companyDescription: 'Platform administrator for MicroHire',
        website: 'https://microhire.com',
      });

      console.log('✅ Admin account created successfully');
      console.log(`📧 Admin Email: ${adminEmail}`);
      console.log(`🔑 Admin Password: ${adminPassword}`);
      console.log('⚠️  Please change the admin password after first login!');
    } else {
      console.log('✅ Admin account already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring admin account:', error);
  }
};

// Add these indexes to the models

// User model indexes
User.addHook('afterSync', async () => {
  await sequelize.query('CREATE INDEX idx_users_email ON Users(email);').catch(() => {});
  await sequelize.query('CREATE INDEX idx_users_role ON Users(role);').catch(() => {});
  await sequelize.query('CREATE INDEX idx_users_is_active ON Users(isActive);').catch(() => {});
});

// Internship model indexes
Internship.addHook('afterSync', async () => {
  await sequelize
    .query('CREATE INDEX idx_internships_company ON Internships(companyId);')
    .catch(() => {});
  await sequelize
    .query('CREATE INDEX idx_internships_status ON Internships(status);')
    .catch(() => {});
  await sequelize
    .query('CREATE INDEX idx_internships_deadline ON Internships(deadline);')
    .catch(() => {});
  await sequelize
    .query('CREATE INDEX idx_internships_category ON Internships(category);')
    .catch(() => {});
});

// Application model indexes
Application.addHook('afterSync', async () => {
  await sequelize
    .query('CREATE INDEX idx_applications_student ON Applications(studentId);')
    .catch(() => {});
  await sequelize
    .query('CREATE INDEX idx_applications_internship ON Applications(internshipId);')
    .catch(() => {});
  await sequelize
    .query('CREATE INDEX idx_applications_status ON Applications(status);')
    .catch(() => {});
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
  ReviewReport,
  CertificateView,
  SearchHistory,
  SystemSettings,
  Bookmark,
  Interview,
  Conversation,
  syncDatabase,
  initializeDatabase,
};
