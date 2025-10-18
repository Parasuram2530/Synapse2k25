const express = require('express');
const {
  submitAssignment,
  getSubmissionsByAssignment,
  getStudentSubmissions,
  gradeSubmission,
  getStudentSubmissionForAssignment,
  upload
} = require('../controllers/submissionController');

// Middleware to verify JWT token
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Submission routes
router.post('/', upload.single('file'), submitAssignment);
router.get('/assignment/:assignmentId', getSubmissionsByAssignment);
router.get('/assignment/:assignmentId/student', getStudentSubmissionForAssignment);
router.get('/course/:courseId', getStudentSubmissions);
router.put('/:id/grade', gradeSubmission);

module.exports = router;