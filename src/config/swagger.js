const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MicroHire API Documentation',
      version: '1.0.0',
      description:
        'Comprehensive API documentation for MicroHire platform - an internship and job platform connecting students with companies',
      contact: {
        name: 'MicroHire API Support',
        email: 'support@microhire.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.microhire.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fullName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['student', 'company', 'admin'] },
            bio: { type: 'string' },
            skills: { type: 'string' },
            companyName: { type: 'string' },
            contactPerson: { type: 'string' },
            companyDescription: { type: 'string' },
            website: { type: 'string' },
            phone: { type: 'string' },
            emailVerified: { type: 'boolean' },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Internship: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            companyId: { type: 'integer' },
            location: { type: 'string' },
            type: { type: 'string', enum: ['remote', 'onsite', 'hybrid'] },
            duration: { type: 'string' },
            stipend: { type: 'number' },
            requirements: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['active', 'inactive', 'closed'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            internshipId: { type: 'integer' },
            studentId: { type: 'integer' },
            status: {
              type: 'string',
              enum: ['pending', 'reviewed', 'accepted', 'rejected', 'withdrawn'],
            },
            coverLetter: { type: 'string' },
            resume: { type: 'string' },
            portfolio: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            conversationId: { type: 'string' },
            senderId: { type: 'integer' },
            content: { type: 'string' },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            type: { type: 'string', enum: ['application', 'message', 'system', 'reminder'] },
            title: { type: 'string' },
            message: { type: 'string' },
            read: { type: 'boolean' },
            data: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            reviewerId: { type: 'integer' },
            reviewedId: { type: 'integer' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            type: { type: 'string', enum: ['student', 'company'] },
            status: { type: 'string', enum: ['active', 'reported', 'moderated'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Certificate: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            studentId: { type: 'integer' },
            companyId: { type: 'integer' },
            internshipId: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            issueDate: { type: 'string', format: 'date' },
            expiryDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
            certificateUrl: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' },
            statusCode: { type: 'integer' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
