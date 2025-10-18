const express = require('express');
const {
  createCourse,
  getCourses,
  getCoursesByTeacher,
  enrollInCourse,
  getEnrolledCourses
} = require('../controllers/courseController');

// Middleware to verify JWT token (we'll create this)
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/:courseId', getCourses);

// Protected routes
router.post('/', protect, createCourse);
router.get('/enrolled', protect, getEnrolledCourses);
router.get('/teacher/:teacherId', protect, getCoursesByTeacher);
router.post('/:courseId/enroll', protect, enrollInCourse);

module.exports = router;