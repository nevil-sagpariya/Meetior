'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const { startReminderWorker } = require('./jobs/reminderWorker');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

// Body parsers
// Preserve the exact Razorpay webhook bytes before the JSON parser consumes them.
app.use('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory for event images and sketch outputs
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// Serve frontend static files if accessed directly on the backend port
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/organizer', require('./routes/organizerRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/demands', require('./routes/demandRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'Disconnected';
  try {
    await sequelize.authenticate();
    dbStatus = 'Connected';
  } catch (err) {
    dbStatus = `Error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    project: 'MEETIOR - Local Event Discovery Platform',
    timestamp: new Date(),
    database: dbStatus,
    location_database: 'Local seeded reference data (coverage varies by state and locality)'
  });
});

// Single Page Application Fallback for Frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  const indexPath = path.join(frontendDir, 'index.html');
  res.sendFile(indexPath);
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Initialize database & start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected successfully.');

    // Sync database tables (creates tables if they don't exist without dropping existing data)
    await sequelize.sync({ alter: false });
    console.log('✅ Sequelize models synchronized with MySQL.');

    // Start background reminder worker
    startReminderWorker();

    app.listen(PORT, () => {
      console.log(`
============================================================
  🎨 MEETIOR — Local Event Discovery & Meetup Platform
============================================================
  🚀 Backend Server running on : http://localhost:${PORT}
  🌐 Frontend running on       : http://localhost:${PORT}/
  📊 Health Check endpoint     : http://localhost:${PORT}/api/health
  📁 Static Uploads directory  : http://localhost:${PORT}/uploads/
============================================================
      `);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MySQL database:', err.message);
    console.error('Please verify your MySQL server is running and check .env credentials.');
    
    // Start HTTP server anyway so health check and offline assets can be served
    app.listen(PORT, () => {
      console.log(`⚠️  Meetior Server running on http://localhost:${PORT} with DB disconnected.`);
    });
  }
};

// Importing the app lets integration tests bind an isolated database and port.
if (require.main === module) startServer();

module.exports = app;
