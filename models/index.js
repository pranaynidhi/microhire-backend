const sequelize = require('../config/database');
const User = require('./User');
const Internship = require('./Internship');
const Application = require('./Application');
const Notification = require('./Notification');
const Message = require('./Messages');

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

module.exports = {
  sequelize,
  User,
  Internship,
  Application,
  Message,
  Notification,
  syncDatabase,
};
