const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Fail fast at startup if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  console.error('[FATAL STARTUP ERROR] JWT_SECRET is not configured in environment variables.');
  process.exit(1);
}

// Connect to MongoDB Database
connectDB();

const app = express();

// Trust reverse proxy headers (X-Forwarded-For) on cloud platforms (Render, Railway, Fly.io, Nginx)
if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// Security HTTP Headers with permissive CSP for CDN scripts (Chart.js, TensorFlow, Tailwind)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS allowlist configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', '*'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin === 'null' || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin ${origin} not permitted.`));
      }
    },
    credentials: true
  })
);

// Prevent NoSQL operator injection attacks ($where, $gt, etc.)
app.use(mongoSanitize());

// 100kb limit strictly for interview JSON routes; 1mb for general endpoints
app.use('/api/modules/interviews', express.json({ limit: '100kb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global API rate limiter
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP address. Please try again later.' }
});
app.use('/api', globalApiLimiter);

// Healthcheck & Detailed Status Route
app.get('/api/status', async (req, res) => {
  const mongoose = require('mongoose');
  const isConnected = mongoose.connection.readyState === 1;
  let collectionNames = [];
  try {
    if (isConnected) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      collectionNames = collections.map(c => c.name);
    }
  } catch (e) {}

  res.json({
    success: true,
    status: 'Active',
    message: isConnected 
      ? 'SkillSync AI MongoDB Database is connected and active' 
      : 'SkillSync AI Server is running but database is disconnected',
    database: {
      engine: 'MongoDB',
      connected: isConnected,
      host: mongoose.connection.host || '127.0.0.1',
      port: mongoose.connection.port || 27017,
      name: mongoose.connection.name || 'skillsync_ai',
      collectionsCount: collectionNames.length,
      collections: collectionNames
    },
    serverTime: new Date().toISOString()
  });
});

const path = require('path');
const frontendDir = path.resolve(__dirname, '../../skillsync-ai-frontend/skillsync-ai-frontend');

// Serve static frontend files (CSS, JS, Assets)
app.use(express.static(frontendDir));

// API Catalog
app.get('/api', (req, res) => {
  res.json({
    platform: 'SkillSync AI Backend REST API',
    status: 'Active',
    database: 'MongoDB',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: [
      '/api/status',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/me',
      '/api/students/profile',
      '/api/resumes/current',
      '/api/resumes/scan',
      '/api/coding-profiles',
      '/api/coding-profiles/sync',
      '/api/modules/skill-gaps',
      '/api/modules/roadmaps',
      '/api/modules/roadmaps/generate-from-resume',
      '/api/modules/interviews',
      '/api/modules/placement-readiness',
      '/api/modules/mentor/chat'
    ]
  });
});

// Serve frontend app at root / and /app
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});
app.get('/app', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/coding-profiles', require('./routes/codingRoutes'));
app.use('/api/modules/mentor', require('./routes/mentorRoutes'));
app.use('/api/modules/interviews', require('./routes/interviewRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[SkillSync AI Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[SkillSync AI API URL] http://localhost:${PORT}/api/students/profile`);
});

module.exports = app;
