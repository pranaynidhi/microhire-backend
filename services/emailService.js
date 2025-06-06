const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"MicroHire" <${process.env.SMTP_FROM}>`,
        to,
        subject,
        html,
      });
      return info;
    } catch (error) {
      console.error('Send email error:', error);
      throw error;
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Email templates
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to MicroHire!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to MicroHire, ${user.fullName}!</h2>
        <p>Thank you for joining MicroHire, Nepal's premier micro-internship platform.</p>
        
        ${user.role === 'student' ? `
          <p>As a student, you can now:</p>
          <ul>
            <li>Browse exciting internship opportunities</li>
            <li>Apply with personalized cover letters</li>
            <li>Track your application status</li>
            <li>Connect with top companies in Nepal</li>
          </ul>
        ` : `
          <p>As a business, you can now:</p>
          <ul>
            <li>Post internship opportunities</li>
            <li>Review student applications</li>
            <li>Connect with talented students</li>
            <li>Build your team with fresh talent</li>
          </ul>
        `}
        
        <p>Get started by logging into your dashboard:</p>
        <a href="${process.env.CLIENT_URL}/dashboard" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Go to Dashboard
        </a>
        
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The MicroHire Team
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendApplicationNotification(company, student, internship) {
    const subject = `New Application for ${internship.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Application Received</h2>
        <p>Hello ${company.fullName},</p>
        
        <p>You have received a new application for your internship:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${internship.title}</h3>
          <p><strong>Applicant:</strong> ${student.fullName}</p>
          <p><strong>Email:</strong> ${student.email}</p>
          <p><strong>Skills:</strong> ${student.skills || 'Not specified'}</p>
        </div>
        
        <p>Review the application and respond to the candidate:</p>
        <a href="${process.env.CLIENT_URL}/dashboard/internships/${internship.id}/applications" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Review Application
        </a>
        
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The MicroHire Team
        </p>
      </div>
    `;

    return this.sendEmail(company.email, subject, html);
  }

  async sendApplicationStatusUpdate(student, internship, company, status) {
    const statusMessages = {
      accepted: {
        subject: `Congratulations! Your application has been accepted`,
        message: 'We are pleased to inform you that your application has been accepted!',
        color: '#10b981',
      },
      rejected: {
        subject: `Application Update for ${internship.title}`,
        message: 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.',
        color: '#ef4444',
      },
    };

    const statusInfo = statusMessages[status];
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusInfo.color};">Application Status Update</h2>
        <p>Hello ${student.fullName},</p>
        
        <p>${statusInfo.message}</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${internship.title}</h3>
          <p><strong>Company:</strong> ${company.companyName}</p>
          <p><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold; text-transform: capitalize;">${status}</span></p>
        </div>
        
        ${status === 'accepted' ? `
          <p>The company will contact you soon with next steps. You can also reach out to them directly through the platform.</p>
        ` : `
          <p>Don't be discouraged! Keep applying to other opportunities on MicroHire.</p>
        `}
        
        <a href="${process.env.CLIENT_URL}/dashboard/applications" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          View All Applications
        </a>
        
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The MicroHire Team
        </p>
      </div>
    `;

    return this.sendEmail(student.email, statusInfo.subject, html);
  }

  async sendDeadlineReminder(student, internships) {
    const subject = 'Application Deadlines Approaching';
    const internshipList = internships.map(internship => `
      <li style="margin-bottom: 10px;">
        <strong>${internship.title}</strong> at ${internship.company.companyName}
        <br>
        <span style="color: #ef4444;">Deadline: ${new Date(internship.deadline).toLocaleDateString()}</span>
      </li>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Application Deadlines Approaching</h2>
        <p>Hello ${student.fullName},</p>
        
        <p>Don't miss out! The following internships have application deadlines approaching:</p>
        
        <ul style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${internshipList}
        </ul>
        
        <p>Apply now to secure your spot:</p>
        <a href="${process.env.CLIENT_URL}/internships" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Browse Internships
        </a>
        
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The MicroHire Team
        </p>
      </div>
    `;

    return this.sendEmail(student.email, subject, html);
  }

  async sendApplicationReceivedEmail(userEmail, studentName, internshipTitle) {
    const subject = 'New Application Received';
    const html = `
      <h2>New Application Received</h2>
      <p>${studentName} has applied for your internship: ${internshipTitle}</p>
      <p>Login to your account to review the application.</p>
    `;
    return this.sendEmail(userEmail, subject, html);
  }

  async sendApplicationStatusEmail(userEmail, status, internshipTitle, companyName) {
    const subject = 'Application Status Update';
    const html = `
      <h2>Application Status Update</h2>
      <p>Your application for ${internshipTitle} at ${companyName} has been ${status}.</p>
    `;
    return this.sendEmail(userEmail, subject, html);
  }

  async sendNewMessageEmail(userEmail, senderName) {
    const subject = 'New Message Received';
    const html = `
      <h2>New Message</h2>
      <p>You have received a new message from ${senderName}.</p>
      <p>Login to your account to view the message.</p>
    `;
    return this.sendEmail(userEmail, subject, html);
  }

  async sendDeadlineReminderEmail(userEmail, internshipTitle, daysLeft) {
    const subject = 'Application Deadline Reminder';
    const html = `
      <h2>Application Deadline Reminder</h2>
      <p>Only ${daysLeft} days left to apply for ${internshipTitle}.</p>
      <p>Don't miss this opportunity!</p>
    `;
    return this.sendEmail(userEmail, subject, html);
  }
}

module.exports = new EmailService();
