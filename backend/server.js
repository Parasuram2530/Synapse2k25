const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to database for Vercel serverless functions
connectDB().catch(err => {
  console.error('Database connection failed:', err);
  // Continue without database for demo purposes
});

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'https://studyzone-qaio30kzc-parasuramgoud30-1909s-projects.vercel.app'
];

// Add environment variable origin if set
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Handle preflight requests explicitly for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
console.log('Setting up routes...');

// Test route - place BEFORE other routes to ensure it takes precedence
app.post('/api/test-assignments', (req, res) => {
  console.log('TEST ROUTE HIT - Direct assignment route:', req.body);
  res.json({
    success: true,
    message: 'Test assignment route working',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Debug route to check if auth routes are working
app.get('/api/debug-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are accessible',
    timestamp: new Date().toISOString()
  });
});

// Original routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/discussions', require('./routes/discussions'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/notifications', require('./routes/notifications'));
console.log('Routes setup complete');

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve specific HTML pages BEFORE static files to ensure they take precedence
app.get('/create-course.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/create-course.html'));
});

app.get('/create-assignment.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/create-assignment.html'));
});

app.get('/upload-material.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/upload-material.html'));
});

app.get('/create-discussion.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/create-discussion.html'));
});

app.get('/notifications.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/notifications.html'));
});

app.get('/grade-submission.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/grade-submission.html'));
});

app.get('/view-submissions.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/view-submissions.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/profile.html'));
});

app.get('/features.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/features.html'));
});

app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/about.html'));
});

app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/contact.html'));
});

// Serve static files from frontend directory (AFTER specific routes)
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve index.html for root route and any unmatched routes (SPA fallback)
// This should be placed AFTER all other routes
app.use((req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);

  // For API routes, return JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  }

  // For frontend routes, serve index.html (SPA fallback)
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;