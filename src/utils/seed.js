const bcrypt = require('bcryptjs');
const {
  User,
  Internship,
  Application,
  Review,
  Notification,
  Message,
  Certificate,
} = require('../models');
const logger = require('./logger');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Certificate.destroy({ where: {}, force: true });
    await Message.destroy({ where: {}, force: true });
    await Notification.destroy({ where: {}, force: true });
    await Review.destroy({ where: {}, force: true });
    await Application.destroy({ where: {}, force: true });
    await Internship.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    console.log('✅ Existing data cleared');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create users
    console.log('👥 Creating users...');
    const student = await User.create({
      fullName: 'Test Student',
      email: 'student@test.com',
      password: hashedPassword,
      role: 'student',
      bio: 'A passionate student.',
      skills: 'JavaScript,Node.js,SQL',
      isActive: true,
      emailVerified: true,
    });

    const company = await User.create({
      fullName: 'Test Company',
      email: 'company@test.com',
      password: hashedPassword,
      role: 'business',
      companyName: 'Test Company',
      contactPerson: 'John Doe',
      companyDescription: 'A leading tech company.',
      website: 'https://testcompany.com',
      phone: '1234567890',
      isActive: true,
      emailVerified: true,
    });

    const admin = await User.create({
      fullName: 'Test Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });

    console.log('✅ Users created');

    // Create internships
    console.log('💼 Creating internships...');
    const internship = await Internship.create({
      title: 'Backend Developer Internship',
      description:
        'Work on backend systems using Node.js and SQL. This is a great opportunity to learn about web development and database management.',
      requirements: 'Node.js, SQL, REST API knowledge',
      location: 'Remote',
      stipend: 10000.0,
      duration: '3 months',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      companyId: company.id,
      status: 'active',
      type: 'remote',
      category: 'Development',
      maxApplicants: 10,
      skills: ['Node.js', 'SQL', 'REST API', 'JavaScript'],
    });

    // Create more internships for variety
    await Internship.create({
      title: 'Frontend Developer Internship',
      description: 'Build beautiful user interfaces using React and modern web technologies.',
      requirements: 'React, JavaScript, CSS, HTML',
      location: 'Kathmandu',
      stipend: 12000.0,
      duration: '4 months',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      companyId: company.id,
      status: 'active',
      type: 'onsite',
      category: 'Development',
      maxApplicants: 8,
      skills: ['React', 'JavaScript', 'CSS', 'HTML'],
    });

    await Internship.create({
      title: 'Data Science Internship',
      description: 'Analyze data and build machine learning models.',
      requirements: 'Python, Pandas, NumPy, basic ML knowledge',
      location: 'Pokhara',
      stipend: 15000.0,
      duration: '6 months',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      companyId: company.id,
      status: 'active',
      type: 'hybrid',
      category: 'Data Science',
      maxApplicants: 5,
      skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning'],
    });

    console.log('✅ Internships created');

    // Create applications
    console.log('📝 Creating applications...');
    await Application.create({
      internshipId: internship.id,
      studentId: student.id,
      coverLetter:
        'I am excited to apply for this internship. I have experience in Node.js and SQL.',
      status: 'pending',
      appliedAt: new Date(),
    });

    console.log('✅ Applications created');

    // Create reviews
    console.log('⭐ Creating reviews...');
    await Review.create({
      reviewerId: student.id,
      revieweeId: company.id,
      internshipId: internship.id,
      rating: 5,
      comment: 'Great company and learning experience!',
      type: 'student_to_company',
      isVisible: true,
      status: 'approved',
    });

    console.log('✅ Reviews created');

    // Create notifications
    console.log('🔔 Creating notifications...');
    await Notification.create({
      userId: student.id,
      title: 'Application Received',
      message: 'Your application for Backend Developer Internship has been received.',
      type: 'application_received',
      isRead: false,
      priority: 'medium',
    });

    console.log('✅ Notifications created');

    // Create messages
    console.log('💬 Creating messages...');
    await Message.create({
      senderId: student.id,
      receiverId: company.id,
      content: 'Hello, I am interested in your internship!',
      messageType: 'text',
      isRead: false,
      conversationId: `conv_${student.id}_${company.id}`,
    });

    console.log('✅ Messages created');

    // Create certificates
    console.log('🏆 Creating certificates...');
    await Certificate.create({
      certificateId: 'CERT-001',
      studentId: student.id,
      companyId: company.id,
      internshipId: internship.id,
      studentName: 'Test Student',
      companyName: 'Test Company',
      internshipTitle: 'Backend Developer Internship',
      startDate: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000), // 3 months ago
      endDate: new Date(),
      skills: 'Node.js, SQL',
      performance: 'Excellent',
      issuedAt: new Date(),
      isValid: true,
    });

    console.log('✅ Certificates created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Created data summary:');
    console.log('- Users: 3 (Student, Company, Admin)');
    console.log('- Internships: 3 (Backend, Frontend, Data Science)');
    console.log('- Applications: 1');
    console.log('- Reviews: 1');
    console.log('- Notifications: 1');
    console.log('- Messages: 1');
    console.log('- Certificates: 1');

    console.log('\n🔑 Test credentials:');
    console.log('Student: student@test.com / password123');
    console.log('Company: company@test.com / password123');
    console.log('Admin: admin@test.com / password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    logger.error('Database seeding error:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
