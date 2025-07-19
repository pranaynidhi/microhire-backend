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
    logger.info('🌱 Starting database seeding...');

    // Clear existing data
    logger.info('🧹 Clearing existing data...');
    await Certificate.destroy({ where: {}, force: true });
    await Message.destroy({ where: {}, force: true });
    await Notification.destroy({ where: {}, force: true });
    await Review.destroy({ where: {}, force: true });
    await Application.destroy({ where: {}, force: true });
    await Internship.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    logger.info('✅ Existing data cleared');

    // Create users
    logger.info('👥 Creating users...');
    const student = await User.create({
      fullName: 'Test Student',
      email: 'student@microhire.com',
      password: 'Nidhi@7733',
      role: 'student',
      bio: 'A passionate student.',
      skills: 'JavaScript,Node.js,SQL',
      isActive: true,
      emailVerified: true,
    });

    const company = await User.create({
      fullName: 'Test Company',
      email: 'company@microhire.com',
      password: 'Nidhi@7733',
      role: 'business',
      companyName: 'Test Company',
      contactPerson: 'John Doe',
      companyDescription: 'A leading tech company.',
      website: 'https://testcompany.com',
      phone: '1234567890',
      isActive: true,
      emailVerified: true,
    });

    // Remove unused variable 'admin'
    // const admin = await User.create({ ... });
    await User.create({
      fullName: 'Test Admin',
      email: 'admin@microhire.com',
      password: 'Nidhi@7733',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });

    logger.info('✅ Users created');

    // Create internships
    logger.info('💼 Creating internships...');
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

    logger.info('✅ Internships created');

    // Create applications
    logger.info('📝 Creating applications...');
    await Application.create({
      internshipId: internship.id,
      studentId: student.id,
      coverLetter:
        'I am excited to apply for this internship. I have experience in Node.js and SQL.',
      status: 'pending',
      appliedAt: new Date(),
    });

    logger.info('✅ Applications created');

    // Create reviews
    logger.info('⭐ Creating reviews...');
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

    logger.info('✅ Reviews created');

    // Create notifications
    logger.info('🔔 Creating notifications...');
    await Notification.create({
      userId: student.id,
      title: 'Application Received',
      message: 'Your application for Backend Developer Internship has been received.',
      type: 'application_received',
      isRead: false,
      priority: 'medium',
    });

    logger.info('✅ Notifications created');

    // Create conversation for messages
    logger.info('💬 Creating conversations...');
    const conversation = await require('../models').Conversation.create({
      participant1Id: student.id,
      participant2Id: company.id,
      lastMessageId: null,
      lastMessageAt: null,
    });
    logger.info('✅ Conversations created');

    // Create messages
    logger.info('💬 Creating messages...');
    const message = await Message.create({
      senderId: student.id,
      receiverId: company.id,
      content: 'Hello, I am interested in your internship!',
      messageType: 'text',
      isRead: false,
      conversationId: conversation.id,
    });

    // Optionally update conversation with last message
    conversation.lastMessageId = message.id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    logger.info('✅ Messages created');

    // Create certificates
    logger.info('🏆 Creating certificates...');
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

    logger.info('✅ Certificates created');

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('\n📋 Created data summary:');
    logger.info('- Users: 3 (Student, Company, Admin)');
    logger.info('- Internships: 3 (Backend, Frontend, Data Science)');
    logger.info('- Applications: 1');
    logger.info('- Reviews: 1');
    logger.info('- Notifications: 1');
    logger.info('- Messages: 1');
    logger.info('- Certificates: 1');

    logger.info('\n🔑 Test credentials:');
    logger.info('Student: student@microhire.com / Nidhi@7733');
    logger.info('Company: company@microhire.com / Nidhi@7733');
    logger.info('Admin: admin@microhire.com / Nidhi@7733');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    logger.error('Database seeding error:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
