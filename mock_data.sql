-- Clean tables for a fresh start
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE Certificates;
TRUNCATE TABLE Messages;
TRUNCATE TABLE Notifications;
TRUNCATE TABLE Reviews;
TRUNCATE TABLE Applications;
TRUNCATE TABLE Internships;
TRUNCATE TABLE Users;
SET FOREIGN_KEY_CHECKS=1;

-- Users
INSERT INTO Users (id, full_name, email, password, role, bio, skills, resume_url, company_name, contact_person, company_description, website, phone, is_active, logo_url, email_verified, created_at, updated_at, deleted_at)
VALUES
  (1, 'Test Student', 'student@test.com', '$2a$12$GL2miN/jE.FqxbYs/ZLvnuJ/43ueJ3ENTRSe2cVOwaAgh8RmnXiEi', 'student', 'A passionate student.', 'JavaScript,Node.js,SQL', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, NOW(), NOW(), NULL),
  (2, 'Test Company', 'company@test.com', '$2a$12$GL2miN/jE.FqxbYs/ZLvnuJ/43ueJ3ENTRSe2cVOwaAgh8RmnXiEi', 'business', NULL, NULL, NULL, 'Test Company', 'John Doe', 'A leading tech company.', 'https://testcompany.com', '1234567890', 1, NULL, 1, NOW(), NOW(), NULL),
  (3, 'Test Admin', 'admin@test.com', '$2a$12$GL2miN/jE.FqxbYs/ZLvnuJ/43ueJ3ENTRSe2cVOwaAgh8RmnXiEi', 'admin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, NOW(), NOW(), NULL);

-- Internships
INSERT INTO Internships (id, title, description, requirements, location, stipend, duration, deadline, company_id, status, type, category, max_applicants, created_at, updated_at, deleted_at)
VALUES
  (1, 'Backend Developer Internship', 'Work on backend systems.', 'Node.js, SQL, REST', 'Remote', 10000.00, '3 months', DATE_ADD(NOW(), INTERVAL 30 DAY), 2, 'active', 'remote', 'Development', 10, NOW(), NOW(), NULL);

-- Applications
INSERT INTO Applications (id, internship_id, user_id, cover_letter, status, applied_at, reviewed_at, notes, created_at, updated_at, deleted_at)
VALUES
  (1, 1, 1, 'I am excited to apply for this internship. I have experience in Node.js and SQL.', 'pending', NOW(), NULL, NULL, NOW(), NOW(), NULL);

-- Reviews
INSERT INTO Reviews (id, reviewer_id, reviewee_id, internship_id, rating, comment, type, is_visible, status, admin_notes, report_count, last_reported_at, created_at, updated_at, deleted_at)
VALUES
  (1, 1, 2, 1, 5, 'Great company and learning experience!', 'student_to_company', 1, 'approved', NULL, 0, NULL, NOW(), NOW(), NULL);

-- Notifications
INSERT INTO Notifications (id, user_id, title, message, type, is_read, read_at, action_url, metadata, priority, expires_at, created_at, updated_at, deleted_at)
VALUES
  (1, 1, 'Application Received', 'Your application for Backend Developer Internship has been received.', 'application_received', 0, NULL, NULL, NULL, 'medium', NULL, NOW(), NOW(), NULL);

-- Messages
INSERT INTO Messages (id, sender_id, receiver_id, content, message_type, file_url, file_name, is_read, read_at, is_deleted, deleted_at, conversation_id, created_at, updated_at)
VALUES
  (1, 1, 2, 'Hello, I am interested in your internship!', 'text', NULL, NULL, 0, NULL, 0, NULL, 'conv_1_2', NOW(), NOW());

-- Certificates
INSERT INTO Certificates (id, certificate_id, student_id, company_id, internship_id, student_name, company_name, internship_title, start_date, end_date, skills, performance, issued_at, is_valid, is_revoked, revoked_at, revoked_reason, share_token, share_expires_at, view_count, created_at, updated_at, deleted_at)
VALUES
  (1, 'CERT-001', 1, 2, 1, 'Test Student', 'Test Company', 'Backend Developer Internship', DATE_SUB(NOW(), INTERVAL 3 MONTH), NOW(), 'Node.js, SQL', 'Excellent', NOW(), 1, 0, NULL, NULL, NULL, NULL, 0, NOW(), NOW(), NULL); 