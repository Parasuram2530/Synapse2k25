const express = require('express');
const {
  createAssignment,
  getAssignmentsByCourse,
  getAssignment
} = require('../controllers/assignmentController');

// Middleware to verify JWT token
const { protect } = require('../middleware/auth');

const router = express.Router();

console.log('Setting up assignment routes...');

// All routes require authentication
router.use(protect);

console.log('Assignment routes with protection applied');

// Assignment routes
router.post('/', createAssignment);
router.get('/course/:courseId', getAssignmentsByCourse);
router.get('/:id', getAssignment);

console.log('Assignment routes configured');

module.exports = router;