const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./src/models');

async function createAdmin() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected');

    const adminEmail = 'admin@moolpahiran.com';
    const adminPassword = 'Nidhi@7733';

    // Check if admin exists
    console.log('Looking for admin user...');
    const existingAdmin = await User.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('Admin user found:', {
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
        console.log('Updated user role to admin');
      }

      // Update the password to ensure it's correct
      console.log('Updating admin password...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await existingAdmin.update({ password: hashedPassword });
      console.log('Admin password updated successfully');
    } else {
      console.log('Creating admin user...');
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

      console.log('Admin user created:', {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });
    }

    await sequelize.close();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
