const sequelize = require('../config/database');
const User = require('./User');
const Internship = require('./Internship');
const Application = require('./Application');

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
  syncDatabase,
};
