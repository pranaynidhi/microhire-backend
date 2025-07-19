'use strict';

/**
 * Set up all model associations in one centralized location
 * This helps avoid circular dependencies and keeps all associations in one place
 * @param {Object} models - Object containing all models
 */
const setupAssociations = (models) => {
  const {
    User,
    BlacklistedToken,
    Internship,
    Application,
    Bookmark,
    Certificate,
    CertificateView,
    Conversation,
    File,
    Interview,
    Notification,
    Report,
    Review,
    ReviewReport,
    SearchHistory,
    SystemSettings,
    Analytics
  } = models;

  // ======================
  // User Associations
  // ======================
  User.hasMany(BlacklistedToken, {
    foreignKey: 'userId',
    as: 'blacklistedTokens'
  });
  
  // User as company posting internships
  User.hasMany(Internship, {
    foreignKey: 'companyId',
    as: 'postedInternships'
  });
  
  // User as student applying to internships
  User.hasMany(Internship, {
    foreignKey: 'studentId',
    as: 'appliedInternships'
  });
  
  // User's applications
  User.hasMany(Application, {
    foreignKey: 'studentId',
    as: 'applications'
  });
  
  // User's bookmarks
  User.hasMany(Bookmark, {
    foreignKey: 'userId',
    as: 'bookmarks'
  });
  
  // User's certificates
  User.hasMany(Certificate, {
    foreignKey: 'studentId',
    as: 'certificates'
  });
  
  // User's certificate views
  User.hasMany(CertificateView, {
    foreignKey: 'viewerId',
    as: 'certificateViews'
  });
  
  // User's conversations (as participant1 or participant2)
  User.hasMany(Conversation, {
    foreignKey: 'participant1Id',
    as: 'initiatedConversations'
  });
  
  User.hasMany(Conversation, {
    foreignKey: 'participant2Id',
    as: 'receivedConversations'
  });
  
  // User's files
  User.hasMany(File, {
    foreignKey: 'uploadedById',
    as: 'uploadedFiles'
  });
  
  // User's interviews (as interviewer or interviewee)
  User.hasMany(Interview, {
    foreignKey: 'interviewerId',
    as: 'interviewsAsInterviewer'
  });
  
  User.hasMany(Interview, {
    foreignKey: 'intervieweeId',
    as: 'interviewsAsInterviewee'
  });
  
  // User's notifications
  User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications'
  });
  
  // User's reports (as reporter)
  User.hasMany(Report, {
    foreignKey: 'reporterId',
    as: 'reports'
  });
  
  // User's reviews (as reviewer or reviewee)
  User.hasMany(Review, {
    foreignKey: 'reviewerId',
    as: 'reviewsGiven'
  });
  
  User.hasMany(Review, {
    foreignKey: 'revieweeId',
    as: 'reviewsReceived'
  });
  
  // User's search history
  User.hasMany(SearchHistory, {
    foreignKey: 'userId',
    as: 'searchHistory'
  });
  
  // User's analytics events
  User.hasMany(Analytics, {
    foreignKey: 'userId',
    as: 'analyticsEvents'
  });

  // ======================
  // BlacklistedToken Associations
  // ======================
  BlacklistedToken.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // ======================
  // Internship Associations
  // ======================
  Internship.belongsTo(User, {
    foreignKey: 'companyId',
    as: 'company'
  });
  
  Internship.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'student'
  });
  
  Internship.hasMany(Application, {
    foreignKey: 'internshipId',
    as: 'applications'
  });
  
  Internship.hasMany(Bookmark, {
    foreignKey: 'internshipId',
    as: 'bookmarks'
  });
  
  Internship.hasMany(Review, {
    foreignKey: 'internshipId',
    as: 'reviews'
  });

  // ======================
  // Application Associations
  // ======================
  Application.belongsTo(Internship, {
    foreignKey: 'internshipId',
    as: 'internship'
  });
  
  Application.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'student'
  });
  
  Application.belongsTo(User, {
    foreignKey: 'reviewedBy',
    as: 'reviewer'
  });

  // ======================
  // Bookmark Associations
  // ======================
  Bookmark.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  Bookmark.belongsTo(Internship, {
    foreignKey: 'internshipId',
    as: 'internship'
  });

  // ======================
  // Certificate Associations
  // ======================
  Certificate.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'student'
  });
  
  Certificate.belongsTo(Internship, {
    foreignKey: 'internshipId',
    as: 'internship'
  });
  
  Certificate.hasMany(CertificateView, {
    foreignKey: 'certificateId',
    as: 'views'
  });

  // ======================
  // CertificateView Associations
  // ======================
  CertificateView.belongsTo(Certificate, {
    foreignKey: 'certificateId',
    as: 'certificate'
  });
  
  CertificateView.belongsTo(User, {
    foreignKey: 'viewerId',
    as: 'viewer'
  });

  // ======================
  // Conversation Associations
  // ======================
  Conversation.belongsTo(User, {
    foreignKey: 'participant1Id',
    as: 'participant1'
  });
  
  Conversation.belongsTo(User, {
    foreignKey: 'participant2Id',
    as: 'participant2'
  });
  
  Conversation.hasMany(Message, {
    foreignKey: 'conversationId',
    as: 'messages'
  });

  // ======================
  // File Associations
  // ======================
  File.belongsTo(User, {
    foreignKey: 'uploadedById',
    as: 'uploadedBy'
  });

  // ======================
  // Interview Associations
  // ======================
  Interview.belongsTo(User, {
    foreignKey: 'interviewerId',
    as: 'interviewer'
  });
  
  Interview.belongsTo(User, {
    foreignKey: 'intervieweeId',
    as: 'interviewee'
  });
  
  Interview.belongsTo(Application, {
    foreignKey: 'applicationId',
    as: 'application'
  });

  // ======================
  // Notification Associations
  // ======================
  Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // ======================
  // Report Associations
  // ======================
  Report.belongsTo(User, {
    foreignKey: 'reporterId',
    as: 'reporter'
  });
  
  Report.belongsTo(User, {
    foreignKey: 'reportedUserId',
    as: 'reportedUser'
  });
  
  Report.belongsTo(Review, {
    foreignKey: 'reviewId',
    as: 'review'
  });

  // ======================
  // Review Associations
  // ======================
  Review.belongsTo(User, {
    foreignKey: 'reviewerId',
    as: 'reviewer'
  });
  
  Review.belongsTo(User, {
    foreignKey: 'revieweeId',
    as: 'reviewee'
  });
  
  Review.belongsTo(Internship, {
    foreignKey: 'internshipId',
    as: 'internship'
  });
  
  Review.hasMany(ReviewReport, {
    foreignKey: 'reviewId',
    as: 'reports'
  });

  // ======================
  // ReviewReport Associations
  // ======================
  ReviewReport.belongsTo(Review, {
    foreignKey: 'reviewId',
    as: 'review'
  });
  
  ReviewReport.belongsTo(User, {
    foreignKey: 'reporterId',
    as: 'reporter'
  });

  // ======================
  // SearchHistory Associations
  // ======================
  SearchHistory.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // ======================
  // Analytics Associations
  // ======================
  Analytics.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = setupAssociations;
