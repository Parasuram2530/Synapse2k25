const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
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

// Serve static files from frontend directory (AFTER specific routes)
app.use(express.static('../frontend'));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../frontend/index.html');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database (don't wait for it)
  connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Available routes:`);
    console.log(`  POST /api/assignments`);
    console.log(`  GET /api/assignments/course/:courseId`);
    console.log(`  GET /api/assignments/:id`);
  });
};

startServer();

module.exports = app;