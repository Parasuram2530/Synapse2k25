const express = require('express');
const {
  calculateGrade,
  getStudentGrade,
  getCourseGrades,
  updateGrade
} = require('../controllers/gradeController');

// Middleware to verify JWT token
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Grade routes
router.post('/calculate/:studentId/:courseId', calculateGrade);
router.get('/course/:courseId', getStudentGrade);
router.get('/course/:courseId/all', getCourseGrades);
router.put('/:gradeId', updateGrade);

module.exports = router;