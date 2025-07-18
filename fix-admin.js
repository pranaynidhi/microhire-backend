const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./src/models');
const logger = require('./src/utils/logger');

async function createAdmin() {
  try {
    logger.info('Connecting to database...');
    logger.info('Database connected');

    const adminEmail = 'admin@microhire.com';
    const adminPassword = 'Nidhi@7733';

    // Check if admin exists
    logger.info('Looking for admin user...');
    const existingAdmin = await User.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      logger.info('Admin user found:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        role: existingAdmin.role,
        fullName: existingAdmin.fullName,
        emailVerified: existingAdmin.emailVerified,
        isActive: existingAdmin.isActive,
      });

      // Update admin role if needed
      if (existingAdmin.role !== 'admin') {
        await existingAdmin.update({ role: 'admin' });
        logger.info('Updated user role to admin');
      }

      // Update the password to ensure it's correct
      logger.info('Updating admin password...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await existingAdmin.update({ password: hashedPassword });
      logger.info('Admin password updated successfully');
    } else {
      logger.info('Creating admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      const admin = await User.create({
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

      logger.info('Admin user created:', {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });
    }

    await sequelize.close();
    logger.info('Done');
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
