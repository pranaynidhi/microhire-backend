require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function createAdmin() {
  try {
    // First, check if admin exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@moolpahiran.com' },
    });

    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('Nidhi@7733', 12);
      await existingAdmin.update({
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
      });
      console.log('Admin password updated');
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash('Nidhi@7733', 12);
      const admin = await User.create({
        fullName: 'System Administrator',
        email: 'admin@moolpahiran.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
        isActive: true,
        companyName: 'MicroHire Platform',
        contactPerson: 'System Admin',
        companyDescription: 'Platform administrator for MicroHire',
        website: 'https://microhire.com',
      });
      console.log('Admin created:', admin.email);
    }

    // Test login
    const admin = await User.findOne({
      where: { email: 'admin@microhire.com' },
    });

    const passwordMatch = await bcrypt.compare('Nidhi@7733', admin.password);
    console.log('Password verification:', passwordMatch ? 'SUCCESS' : 'FAILED');
    console.log('Admin details:', {
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      emailVerified: admin.emailVerified,
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

createAdmin();
