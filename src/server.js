const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const specs = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { applySecurityMiddleware, applyRateLimit } = require('./middleware/security');
const passport = require('./config/passport');
const { AppError } = require('./utils/errors');

// Import database and models
const { initializeDatabase } = require('./models');
const { initializeSocket } = require('./config/socket');
const { initializeRealtimeService } = require('./services/realtimeService');
const attachSocket = require('./middleware/socketMiddleware');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
console.log('DEBUG: io initialized:', io);
console.log('DEBUG: typeof attachSocket:', typeof attachSocket);
const middleware = attachSocket(io);
console.log('DEBUG: typeof attachSocket(io):', typeof middleware);

// Initialize realtime service
initializeRealtimeService(io);
console.log('DEBUG: realtime service initialized');

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173', // Vite's default port
      'http://localhost:3000',
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach Socket.io to requests
app.use(middleware);

// Apply security middleware
applySecurityMiddleware(app);

// Apply rate limiters
app.use(applyRateLimit);

app.use(cookieParser());

// Add CSRF protection

const csrfProtection = csrf({ cookie: true });

// Exclude CSRF for Swagger UI, spec, static assets, and test environment
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api-docs') ||
    req.path === '/swagger-ui-init.js' ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/swagger-ui') || // for swagger-ui static assets
    process.env.NODE_ENV === 'test' || // Disable CSRF in test environment
    process.env.NODE_ENV === 'development' || // Disable CSRF in development for easier testing
    req.headers['x-test-mode'] === 'true' // Allow test mode header
  ) {
    next();
    return;
  }
  csrfProtection(req, res, next);
});

// Add CSRF token to all responses (only if csrfToken is available)
app.use((req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    res.cookie('XSRF-TOKEN', req.csrfToken());
  }
  next();
});

app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Serve custom Swagger UI JS if needed
app.use('/swagger-ui-init.js', express.static(path.join(__dirname, 'utils/swagger-ui-init.js')));

// API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customJs: '/swagger-ui-init.js',
  })
);

// Request logging
app.use((req, res, next) => {
  logger.info(
    JSON.stringify({
      method: req.method,
      url: req.url,
      ip: req.ip,
      user: req.user && req.user.id,
    })
  );
  next();
});

// Routes
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

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({
    success: true,
    message: 'CSRF token available in XSRF-TOKEN cookie',
    timestamp: new Date().toISOString(),
  });
});

// Custom root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the MicroHire API!',
    docs: '/api-docs',
  });
});

// Error handling
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      success: false,
      message: 'CSRF token missing or invalid. Please refresh the page and try again.',
      error: 'CSRF_TOKEN_ERROR',
      code: 'EBADCSRFTOKEN',
    });
    return;
  }
  next(err);
});

app.use(errorHandler);

// Unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  if (process.env.NODE_ENV === 'test') {
    console.error('Test mode: would call process.exit(1)');
  } else {
    process.exit(1);
  }
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  if (process.env.NODE_ENV === 'test') {
    console.error('Test mode: would call process.exit(1)');
  } else {
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.use(passport.initialize());
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server };
