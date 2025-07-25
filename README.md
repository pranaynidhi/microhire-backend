# MicroHire Backend

A production-ready Node.js/Express backend for the MicroHire internship platform with comprehensive features including user management, internship listings, applications, messaging, and analytics.

## Project Overview
MicroHire is a full-stack web application that connects students with businesses for micro-internship opportunities. It features user authentication (including two-factor), role-based dashboards, internship listings, applications, real-time messaging, notifications, analytics, and a comprehensive admin panel.

## Version Control & Video Demo
- **GitHub Repository:** https://github.com/pranaynidhi/microhire-backend
- **Video Demo:** [YOUTUBE_VIDEO_LINK]

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control
- 👥 **User Management**: Student, Business, and Admin roles
- 💼 **Internship Management**: Create, manage, and apply for internships
- 📝 **Application System**: Complete application workflow
- 💬 **Real-time Messaging**: WebSocket-based messaging system
- 📊 **Analytics Dashboard**: Comprehensive platform analytics
- 🔍 **Search & Filtering**: Advanced search capabilities
- 📧 **Email Notifications**: Automated email system
- 🔒 **Security**: CSRF protection, rate limiting, input validation
- 📁 **File Upload**: Secure file handling with validation
- 🎯 **Admin Panel**: Complete administrative interface

## Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd microhire-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with your database and service credentials.

4. **Database Setup**
   ```bash
   # Create database and user
   mysql -u root -p
   CREATE DATABASE microhire_db;
   CREATE USER 'microhire_user'@'localhost' IDENTIFIED BY 'your_password_here';
   GRANT ALL PRIVILEGES ON microhire_db.* TO 'microhire_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Run Migrations**
   ```bash
   npm run migrate
   ```

6. **Start the Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Admin Account

The system automatically creates an admin account on first startup:

- **Email**: `admin@microhire.com` (configurable via `ADMIN_EMAIL`)
- **Password**: `Admin@123` (configurable via `ADMIN_PASSWORD`)

⚠️ **Important**: Change the admin password after first login for security!

## API Documentation

The API documentation is available at `/api-docs` (Swagger UI) when the server is running.

### Key Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/internships` - List internships
- `POST /api/internships` - Create internship (Business only)
- `POST /api/applications` - Apply for internship
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

## Security Features

- **CSRF Protection**: All state-changing requests require CSRF tokens
- **Rate Limiting**: Configurable rate limits on API endpoints
- **Input Validation**: Comprehensive validation using Joi
- **SQL Injection Protection**: Parameterized queries with Sequelize
- **XSS Protection**: Content Security Policy headers
- **Password Security**: Bcrypt hashing with configurable rounds
- **Two-Factor Authentication**: Optional 2FA for enhanced account security
- **Environment Variables**: All secrets and sensitive config are managed via environment variables
- **Security Middleware**: Uses helmet, CORS, and other Express security best practices

## Development

### Running Tests
```bash
npm test
```

### Code Quality
```bash
npm run lint
npm run format
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure production database credentials
3. Set up SSL certificates
4. Configure reverse proxy (nginx recommended)
5. Set up process manager (PM2 recommended)

### PM2 Configuration
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_NAME` | Database name | `microhire_db` |
| `JWT_SECRET` | JWT signing secret | Required |
| `ADMIN_EMAIL` | Admin account email | `admin@microhire.com` |
| `ADMIN_PASSWORD` | Admin account password | `Admin@123` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

## 🌟 Overview

The MicroHire API is a RESTful service that connects students with businesses for micro-internship opportunities in Nepal. The API supports role-based authentication, internship management, and application tracking.

### Key Features

- ✅ JWT-based authentication
- ✅ Role-based access control (Student/Business)
- ✅ Internship CRUD operations
- ✅ Application management system
- ✅ Search and filtering
- ✅ Pagination support
- ✅ Input validation and sanitization

### Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL with Sequelize ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Sequelize built-in validators

---

## 🔐 Authentication

### Authentication Flow

1. Register or login to receive a JWT token
2. Include token in `Authorization` header for protected routes
3. Token expires in 7 days (configurable)

### Header Format

```json
Authorization: Bearer <your_jwt_token>
```

## User Roles

- **Student:** Can apply for internships, view applications
- **Business:** Can post internships, manage applications

---

## ⚠️ Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "fieldName", "message": "Specific error message" }]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Invalid/missing token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `409` - Conflict (Duplicate resource)
- `500` - Internal Server Error

---

## 🛠 Current API Endpoints

### 🔒 Authentication Endpoints

| Method | Endpoint         | Description       | Auth Required |
| ------ | ---------------- | ----------------- | ------------- |
| `POST` | `/auth/register` | Register new user | ❌            |
| `POST` | `/auth/login`    | User login        | ❌            |

### 👤 User Management Endpoints

| Method | Endpoint                 | Description                   | Auth Required | Role     |
| ------ | ------------------------ | ----------------------------- | ------------- | -------- |
| `GET`  | `/users/me`              | Get current user profile      | ✅            | Any      |
| `PUT`  | `/users/me`              | Update user profile           | ✅            | Any      |
| `GET`  | `/users/me/applications` | Get user's applications       | ✅            | Student  |
| `GET`  | `/users/me/internships`  | Get user's posted internships | ✅            | Business |

### 📝 Internship Endpoints

| Method   | Endpoint           | Description                | Auth Required | Role             |
| -------- | ------------------ | -------------------------- | ------------- | ---------------- |
| `GET`    | `/internships`     | Get all active internships | ❌            | Public           |
| `GET`    | `/internships/:id` | Get internship by ID       | ❌            | Public           |
| `POST`   | `/internships`     | Create new internship      | ✅            | Business         |
| `PUT`    | `/internships/:id` | Update internship          | ✅            | Business (Owner) |
| `DELETE` | `/internships/:id` | Delete internship          | ✅            | Business (Owner) |

### 📩 Application Endpoints

| Method  | Endpoint                       | Description                     | Auth Required | Role             |
| ------- | ------------------------------ | ------------------------------- | ------------- | ---------------- |
| `POST`  | `/applications`                | Apply for internship            | ✅            | Student          |
| `GET`   | `/applications/internship/:id` | Get applications for internship | ✅            | Business (Owner) |
| `PATCH` | `/applications/:id`            | Update application status       | ✅            | Business (Owner) |
| `PATCH` | `/applications/:id/withdraw`   | Withdraw application            | ✅            | Student (Owner)  |

### 🏥 System Endpoints

| Method | Endpoint  | Description      | Auth Required |
| ------ | --------- | ---------------- | ------------- |
| `GET`  | `/health` | API health check | ❌            |

---

## 📖 Request/Response Examples

### Authentication Endpoints

#### Register Business

```json
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@company.com",
  "password": "John@123",
  "role": "business",
  "companyName": "Digi Tech Solutions Nepal",
  "contactPerson": "John Doe",
  "companyDescription": "Leading tech company in Nepal",
  "website": "https://digitechsolutions.com.np",
  "phone": "+977-9841234567"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": 1,
      "fullName": "John Doe",
      "email": "john@company.com",
      "role": "business",
      "companyName": "Tech Solutions Nepal",
      "contactPerson": "John Doe",
      "companyDescription": "Leading tech company in Nepal",
      "website": "https://techsolutions.com.np",
      "phone": "+977-9841234567",
      "isActive": true,
      "createdAt": "2025-05-29T10:32:08.000Z",
      "updatedAt": "2025-05-29T10:32:08.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Register Student

```json
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Pranay",
  "email": "pranay@student.com",
  "password": "password123",
  "role": "student",
  "bio": "Computer Science student passionate about web development",
  "skills": "JavaScript, React, Node.js, Python, MySQL"
}
```

#### Login Endpoint

```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@company.com",
  "password": "John@123"
}
```

### Internships Endpoint

#### Create Internship Endpoint

```json
POST /api/internships
Authorization: Bearer <business_token>
Content-Type: application/json

{
  "title": "Frontend Developer Intern",
  "description": "Work on exciting React projects with our development team",
  "requirements": "Knowledge of React, JavaScript, and CSS. Good communication skills.",
  "location": "Kathmandu, Nepal",
  "stipend": 15000,
  "duration": "3 months",
  "deadline": "2025-07-15T23:59:59.000Z",
  "type": "onsite",
  "category": "Web Development",
  "maxApplicants": 20
}
```

**Response:**

```json
{
  "success": true,
  "message": "Internship created successfully.",
  "data": {
    "internship": {
      "id": 1,
      "title": "Frontend Developer Intern",
      "description": "Work on exciting React projects with our development team",
      "requirements": "Knowledge of React, JavaScript, and CSS. Good communication skills.",
      "location": "Kathmandu, Nepal",
      "stipend": "15000.00",
      "duration": "3 months",
      "deadline": "2025-07-15T23:59:59.000Z",
      "type": "onsite",
      "category": "Web Development",
      "maxApplicants": 20,
      "status": "active",
      "companyId": 1,
      "createdAt": "2025-05-29T10:32:08.000Z",
      "updatedAt": "2025-05-29T10:32:08.000Z",
      "company": { "id": 1, "companyName": "Tech Solutions Nepal", "email": "john@company.com" }
    }
  }
}
```

#### Get All Internships with Filters

```json
GET /api/internships?page=1&limit=10&search=frontend&location=kathmandu&type=onsite&category=web
```

**Response:**

```json
{
  "success": true,
  "data": {
    "internships": [
      {
        "id": 1,
        "title": "Frontend Developer Intern",
        "description": "Work on exciting React projects...",
        "location": "Kathmandu, Nepal",
        "stipend": "15000.00",
        "duration": "3 months",
        "deadline": "2025-07-15T23:59:59.000Z",
        "type": "onsite",
        "category": "Web Development",
        "company": { "id": 1, "companyName": "Tech Solutions Nepal", "email": "john@company.com" }
      }
    ],
    "pagination": { "currentPage": 1, "totalPages": 1, "totalItems": 1, "itemsPerPage": 10 }
  }
}
```

## Applications Endpoint

### Apply for Internship

```json
POST /api/applications
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "internshipId": 1,
  "coverLetter": "Dear Hiring Manager,\n\nI am excited to apply for the Frontend Developer Intern position. As a Computer Science student with hands-on experience in React and JavaScript, I am eager to contribute to your team while learning industry best practices.\n\nThank you for your consideration.\n\nBest regards,\nJane Smith"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Application submitted successfully.",
  "data": {
    "application": {
      "id": 1,
      "internshipId": 1,
      "userId": 2,
      "coverLetter": "Dear Hiring Manager...",
      "status": "pending",
      "appliedAt": "2025-05-29T10:32:08.000Z",
      "createdAt": "2025-05-29T10:32:08.000Z",
      "updatedAt": "2025-05-29T10:32:08.000Z",
      "internship": {
        "id": 1,
        "title": "Frontend Developer Intern",
        "company": { "id": 1, "companyName": "Tech Solutions Nepal", "email": "john@company.com" }
      }
    }
  }
}
```

### Update Application Status

```json
PATCH /api/applications/1
Authorization: Bearer <business_token>
Content-Type: application/json

{
  "status": "accepted",
  "notes": "Great candidate with strong technical skills. Looking forward to having them on the team."
}
```

---

## 🚀 Future Enhancements

### Phase 2: Communication System (Completed)

#### Real-time Messaging

```json
POST /api/messages
GET /api/messages/conversation/:userId
GET /api/messages/conversations
PATCH /api/messages/:id/read
```

#### Notifications

```json
GET /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/mark-all-read
```

### Phase 3: Advanced Features (Completed)

#### File Upload System

```json
POST /api/upload/resume
POST /api/upload/company-logo
POST /api/upload/portfolio
DELETE /api/upload/:fileId
```

#### Review & Rating System

```json
POST /api/reviews
GET /api/reviews/user/:userId
GET /api/reviews/company/:companyId
PUT /api/reviews/:id
DELETE /api/reviews/:id
```

#### Certificate Generation

```json
POST /api/certificates/generate
GET /api/certificates/:id
GET /api/certificates/verify/:certificateId
```

### Phase 4: Analytics & Admin (Completed)

#### Analytics Dashboard

```json
GET /api/analytics/overview
GET /api/analytics/internships
GET /api/analytics/applications
GET /api/analytics/users
```

#### Admin Panel

```json
GET /api/admin/users
PATCH /api/admin/users/:id/status
GET /api/admin/internships
PATCH /api/admin/internships/:id/moderate
GET /api/admin/reports
POST /api/admin/reports/:id/resolve
```

#### Advanced Search & Recommendations

```json
GET /api/internships/recommended
GET /api/internships/similar/:id
GET /api/search/advanced
GET /api/search/suggestions
```

### Phase 5: Mobile & Integration (Q4 2025)

#### Mobile API Enhancements

```json
POST /api/mobile/push-tokens
POST /api/mobile/notifications/send
GET /api/mobile/app-config
```

#### Third-party Integrations

```json
POST /api/integrations/linkedin/import
POST /api/integrations/github/connect
POST /api/integrations/calendar/sync
```

#### Payment System (Premium Features)

```json
POST /api/payments/create-subscription
GET /api/payments/invoices
POST /api/payments/cancel-subscription
```

---

## 🔄 Rate Limiting

### Current Limits (Per IP Address)

- **Authentication endpoints:** 5 requests per minute
- **General API endpoints:** 100 requests per minute
- **File upload endpoints:** 10 requests per minute

### Future Implementation

```json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1622547600
```

---

## 📊 Data Models

### User Model

```tsx
interface User {
  id: number;  fullName: string;  email: string;  password: string; // hashed  role: 'student' | 'business';  // Student fields  bio?: string;  skills?: string;  resumeUrl?: string;  // Business fields  companyName?: string;  contactPerson?: string;  companyDescription?: string;  website?: string;  phone?: string;  isActive: boolean;  createdAt: Date;  updatedAt: Date;}
```

### Internship Model

```tsx
interface Internship {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  stipend: number;
  duration: string;
  deadline: Date;
  companyId: number;
  status: 'active' | 'closed' | 'draft';
  type: 'remote' | 'onsite' | 'hybrid';
  category?: string;
  maxApplicants: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Application Model

```tsx
interface Application {
  id: number;
  internshipId: number;
  userId: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: Date;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Database
DB_HOST=localhost
DB_NAME=microhire_db
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

```

---

## 📝 Changelog

### Version 1.0.0 (May 14, 2025)

- ✅ Initial API release
- ✅ User authentication and authorization
- ✅ Internship CRUD operations
- ✅ Application management system
- ✅ Search and filtering
- ✅ Role-based access control

### Version 1.1.0 (June 5 2025)

- ✅ Real-time messaging system
- ✅ Email notifications
- ✅ File upload for resumes
- ✅ Enhanced search with filters

### Version 1.2.0 (June 29 2025)

- ✅ Review and rating system
- ✅ Certificate generation
- ✅ Advanced analytics
- ✅ Admin panel

### Version 1.2.1 (July 2025)
- Assignment submission version: documentation and security updates

---

## 🤝 API Support

### Contact Information

- **Email:** [support@pranaynidhi.tech](mailto:support@pranaynidhi.tech)
- **Documentation:** [https://docs.prnaynidhi.tech](https://docs.prnaynidhi.tech/)
- **Status Page:** [https://status.pranaynidhi.tech](https://status.pranaynidhi.tech/)

### Response Times

- **Critical Issues:** 2 hours
- **General Support:** 24 hours
- **Feature Requests:** 1 week

---

## 📚 Additional Resources

- [Postman Collection](./postman/MicroHire-API.json)
- [OpenAPI Specification](./docs/openapi.yaml)
- [SDK Documentation](./docs/sdk.md)
- [Integration Examples](./examples/)

---

**Last Updated:** June 29, 2025

**API Version:** 1.2.0

**Documentation Version:** 1.2.1
