const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');
const { validate, schemas } = require('./middleware/validation');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import database and models
const { syncDatabase } = require('./models');
const initializeSocket = require('./config/socket');
const attachSocket = require('./middleware/socketMiddleware');
const { securityMiddleware, authLimiter, apiLimiter } = require('./middleware/security');
const { internshipController, applicationController, reviewController } = require('./controllers');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const internshipRoutes = require('./routes/internships');
const applicationRoutes = require('./routes/applications');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const reviewRoutes = require('./routes/reviews');
const certificateRoutes = require('./routes/certificates');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach Socket.io to requests
app.use(attachSocket(io));

// Apply security middleware
app.use(securityMiddleware);

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Add CSRF protection
const csrf = require('csurf');
app.use(csrf({ cookie: true }));

// Add CSRF token to all responses
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    user: req.user?.id
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

app.use('/uploads', express.static('uploads'));

if (process.env.NODE_ENV === 'development') {
  const testRoutes = require('./tests/communication.test');
  app.use('/api/test', testRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MicroHire API is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      internships: '/api/internships',
      applications: '/api/applications',
      messages: '/api/messages',
      notifications: '/api/notifications',
      upload: '/api/upload',
      reviews: '/api/reviews',
      certificates: '/api/certificates',
      analytics: '/api/analytics',
      admin: '/api/admin',
      search: '/api/search',
    },
  });
});

// Error handling
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

// Unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    await syncDatabase();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.io enabled for real-time features`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
