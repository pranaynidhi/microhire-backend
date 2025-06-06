# 📚 MicroHire API Documentation

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [File Uploads](#file-uploads)
7. [WebSocket Events](#websocket-events)
8. [Deployment](#deployment)

## Getting Started

### Prerequisites
- Node.js >= 14.x
- MySQL >= 8.0
- Redis >= 6.0

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/microhire-backend.git
cd microhire-backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations
```bash
npm run migrate
```

5. Start the server
```bash
npm run dev
```

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

## API Endpoints

### Internships

#### Create Internship
```http
POST /api/internships
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Frontend Developer Intern",
  "description": "We are looking for a frontend developer...",
  "requirements": "React, JavaScript, HTML, CSS",
  "location": "Kathmandu",
  "stipend": 15000,
  "duration": "3 months",
  "deadline": "2024-04-01",
  "type": "onsite",
  "category": "Development"
}
```

#### Get Internships
```http
GET /api/internships?page=1&limit=10&category=Development
Authorization: Bearer <token>
```

### Applications

#### Submit Application
```http
POST /api/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "internshipId": 1,
  "coverLetter": "I am interested in this position..."
}
```

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
- File uploads: 10 requests per 15 minutes

## File Uploads

### Supported File Types
- Resumes: PDF, DOC, DOCX
- Logos: JPG, JPEG, PNG, GIF
- Portfolios: PDF, JPG, JPEG, PNG, ZIP

### Size Limits
- Maximum file size: 5MB

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events
- `new_message`: New message received
- `application_update`: Application status changed
- `new_notification`: New notification received

## Deployment

### Production Setup
1. Set environment variables
2. Build the application
```bash
npm run build
```
3. Start the server
```bash
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

---

# 🌟 Overview

The MicroHire API is a RESTful service that connects students with businesses for micro-internship opportunities in Nepal. The API supports role-based authentication, internship management, and application tracking.

## Key Features
- ✅ JWT-based authentication
- ✅ Role-based access control (Student/Business)
- ✅ Internship CRUD operations
- ✅ Application management system
- ✅ Search and filtering
- ✅ Pagination support
- ✅ Input validation and sanitization

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL with Sequelize ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Sequelize built-in validators

---

# 🔐 Authentication

## Authentication Flow
1. Register or login to receive a JWT token
2. Include token in `Authorization` header for protected routes
3. Token expires in 7 days (configurable)

## Header Format
```http
Authorization: Bearer <your_jwt_token>
```

## User Roles
- **Student:** Can apply for internships, view applications
- **Business:** Can post internships, manage applications

---

# ⚠️ Error Handling

## Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

## HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Invalid/missing token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `409` - Conflict (Duplicate resource)
- `500` - Internal Server Error

---

# 🛠 Current API Endpoints

## 🔒 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register new user | ❌ |
| `POST` | `/auth/login` | User login | ❌ |

## 👤 User Management Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/users/me` | Get current user profile | ✅ | Any |
| `PUT` | `/users/me` | Update user profile | ✅ | Any |
| `GET` | `/users/me/applications` | Get user's applications | ✅ | Student |
| `GET` | `/users/me/internships` | Get user's posted internships | ✅ | Business |

## 📝 Internship Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/internships` | Get all active internships | ❌ | Public |
| `GET` | `/internships/:id` | Get internship by ID | ❌ | Public |
| `POST` | `/internships` | Create new internship | ✅ | Business |
| `PUT` | `/internships/:id` | Update internship | ✅ | Business (Owner) |
| `DELETE` | `/internships/:id` | Delete internship | ✅ | Business (Owner) |

## 📩 Application Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/applications` | Apply for internship | ✅ | Student |
| `GET` | `/applications/internship/:id` | Get applications for internship | ✅ | Business (Owner) |
| `PATCH` | `/applications/:id` | Update application status | ✅ | Business (Owner) |
| `PATCH` | `/applications/:id/withdraw` | Withdraw application | ✅ | Student (Owner) |

## 🏥 System Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | API health check | ❌ |

---

# 📖 Request/Response Examples

## Authentication

### Register Business
```http
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

### Register Student
```http
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

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@company.com",
  "password": "John@123"
}
```

## Internships

### Create Internship
```http
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
      "company": {
        "id": 1,
        "companyName": "Tech Solutions Nepal",
        "email": "john@company.com"
      }
    }
  }
}
```

### Get All Internships with Filters
```http
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
        "company": {
          "id": 1,
          "companyName": "Tech Solutions Nepal",
          "email": "john@company.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

## Applications

### Apply for Internship
```http
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
        "company": {
          "id": 1,
          "companyName": "Tech Solutions Nepal",
          "email": "john@company.com"
        }
      }
    }
  }
}
```

### Update Application Status
```http
PATCH /api/applications/1
Authorization: Bearer <business_token>
Content-Type: application/json

{
  "status": "accepted",
  "notes": "Great candidate with strong technical skills. Looking forward to having them on the team."
}
```

---

# 🚀 Future Enhancements

## Phase 2: Communication System (Q3 2025)

### Real-time Messaging
```http
POST /api/messages
GET /api/messages/conversation/:userId
GET /api/messages/conversations
PATCH /api/messages/:id/read
```

### Notifications
```http
GET /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/mark-all-read
```

## Phase 3: Advanced Features (Q4 2025)

### File Upload System
```http
POST /api/upload/resume
POST /api/upload/company-logo
POST /api/upload/portfolio
DELETE /api/upload/:fileId
```

### Review & Rating System
```http
POST /api/reviews
GET /api/reviews/user/:userId
GET /api/reviews/company/:companyId
PUT /api/reviews/:id
DELETE /api/reviews/:id
```

### Certificate Generation
```http
POST /api/certificates/generate
GET /api/certificates/:id
GET /api/certificates/verify/:certificateId
```

## Phase 4: Analytics & Admin (2026)

### Analytics Dashboard
```http
GET /api/analytics/overview
GET /api/analytics/internships
GET /api/analytics/applications
GET /api/analytics/users
```

### Admin Panel
```http
GET /api/admin/users
PATCH /api/admin/users/:id/status
GET /api/admin/internships
PATCH /api/admin/internships/:id/moderate
GET /api/admin/reports
POST /api/admin/reports/:id/resolve
```

### Advanced Search & Recommendations
```http
GET /api/internships/recommended
GET /api/internships/similar/:id
GET /api/search/advanced
GET /api/search/suggestions
```

## Phase 5: Mobile & Integration (2026)

### Mobile API Enhancements
```http
POST /api/mobile/push-tokens
POST /api/mobile/notifications/send
GET /api/mobile/app-config
```

### Third-party Integrations
```http
POST /api/integrations/linkedin/import
POST /api/integrations/github/connect
POST /api/integrations/calendar/sync
```

### Payment System (Premium Features)
```http
POST /api/payments/create-subscription
GET /api/payments/invoices
POST /api/payments/cancel-subscription
```

---

# 🔄 Rate Limiting

## Current Limits (Per IP Address)
- **Authentication endpoints:** 5 requests per minute
- **General API endpoints:** 100 requests per minute
- **File upload endpoints:** 10 requests per minute

## Future Implementation
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1622547600
```

---

# 📊 Data Models

## User Model
```typescript
interface User {
  id: number;
  fullName: string;
  email: string;
  password: string; // hashed
  role: 'student' | 'business';
  
  // Student fields
  bio?: string;
  skills?: string;
  resumeUrl?: string;
  
  // Business fields
  companyName?: string;
  contactPerson?: string;
  companyDescription?: string;
  website?: string;
  phone?: string;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Internship Model
```typescript
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

## Application Model
```typescript
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

# 🔧 Environment Configuration

## Required Environment Variables
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

# 📝 Changelog

## Version 1.0.0 (May 29, 2025)
- ✅ Initial API release
- ✅ User authentication and authorization
- ✅ Internship CRUD operations
- ✅ Application management system
- ✅ Search and filtering
- ✅ Role-based access control

## Planned Version 1.1.0 (June 2025)
- 🔄 Real-time messaging system
- 🔄 Email notifications
- 🔄 File upload for resumes
- 🔄 Enhanced search with filters

## Planned Version 1.2.0 (July 2025)
- 🔄 Review and rating system
- 🔄 Certificate generation
- 🔄 Advanced analytics
- 🔄 Admin panel

---

# 🤝 API Support

## Contact Information
- **Email:** support@pranaynidhi.tech
- **Documentation:** https://docs.prnaynidhi.tech
- **Status Page:** https://status.pranaynidhi.tech

## Response Times
- **Critical Issues:** 2 hours
- **General Support:** 24 hours
- **Feature Requests:** 1 week

---

# 📚 Additional Resources

- [Postman Collection](./postman/MicroHire-API.json)
- [OpenAPI Specification](./docs/openapi.yaml)
- [SDK Documentation](./docs/sdk.md)
- [Integration Examples](./examples/)

---

**Last Updated:** May 29, 2025  
**API Version:** 1.0.0  
**Documentation Version:** 1.0.0