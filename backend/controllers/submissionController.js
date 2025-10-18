const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/submissions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PPT, DOC, XLS, TXT, images, videos, and archives are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// @desc    Submit an assignment
// @route   POST /api/submissions
// @access  Private (Students only)
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, content } = req.body;
    const studentId = req.user.id;

    // Validation - either content or file must be provided
    if (!assignmentId || (!content && !req.file)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assignmentId and either content or file'
      });
    }

    // Verify user is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit assignments'
      });
    }

    // Verify assignment exists
    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify student is enrolled in the course
    if (!assignment.course.enrolledStudents.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    // Check if assignment is past due date and late submissions are not allowed
    const currentTime = new Date();
    if (currentTime > assignment.dueDate && !assignment.allowLateSubmissions) {
      return res.status(400).json({
        success: false,
        message: 'The due date for this assignment has passed and late submissions are not allowed'
      });
    }

    // Prepare submission data
    const submissionData = {
      assignment: assignmentId,
      student: studentId,
      course: assignment.course._id,
      content: content || ''
    };

    // Add file information if uploaded
    if (req.file) {
      submissionData.fileName = req.file.filename;
      submissionData.originalFileName = req.file.originalname;
      submissionData.fileSize = req.file.size;
      submissionData.fileType = req.file.mimetype;
      submissionData.filePath = req.file.path;
    }

    // Create submission
    const submission = await Submission.create(submissionData);

    // Populate assignment and student info
    await submission.populate('assignment', 'title dueDate maxPoints');
    await submission.populate('student', 'name email');
    await submission.populate('course', 'title');

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submission
      }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during submission'
    });
  }
};

// @desc    Get submissions for an assignment (Teachers only)
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private (Teachers only)
const getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user.id;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can view submissions'
      });
    }

    // Verify assignment exists and teacher owns it
    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view submissions for your own assignments'
      });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .populate('assignment', 'title dueDate maxPoints')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        submissions,
        count: submissions.length
      }
    });
  } catch (error) {
    console.error('Get submissions by assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
};

// @desc    Get student's submissions for a course
// @route   GET /api/submissions/course/:courseId
// @access  Private (Students only)
const getStudentSubmissions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Verify user is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view their submissions'
      });
    }

    const submissions = await Submission.find({
      course: courseId,
      student: studentId
    })
      .populate('assignment', 'title dueDate maxPoints')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        submissions,
        count: submissions.length
      }
    });
  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
};

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private (Teachers only)
const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;
    const teacherId = req.user.id;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can grade submissions'
      });
    }

    // Find submission
    const submission = await Submission.findById(id).populate('assignment');
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify teacher owns the assignment
    if (submission.assignment.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You can only grade submissions for your own assignments'
      });
    }

    // Update submission
    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = teacherId;
    await submission.save();

    // Populate updated submission
    await submission.populate('student', 'name email');
    await submission.populate('assignment', 'title maxPoints');
    await submission.populate('gradedBy', 'name');

    // Send notification to student
    try {
      await createNotification({
        recipient: submission.student._id,
        sender: teacherId,
        type: 'grade_received',
        title: 'Assignment Graded',
        message: `Your submission for "${submission.assignment.title}" has been graded. You received a grade of ${grade}/10.`,
        priority: 'medium',
        relatedAssignment: submission.assignment._id,
        relatedCourse: submission.course
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the grading if notification fails
    }

    res.json({
      success: true,
      message: 'Submission graded successfully',
      data: {
        submission
      }
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during grading'
    });
  }
};

// @desc    Get student's submission for a specific assignment
// @route   GET /api/submissions/assignment/:assignmentId/student
// @access  Private (Students only)
const getStudentSubmissionForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    // Verify user is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view their submissions'
      });
    }

    // Verify assignment exists
    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify student is enrolled in the course
    if (!assignment.course.enrolledStudents.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    })
      .populate('assignment', 'title dueDate maxPoints')
      .populate('gradedBy', 'name');

    res.json({
      success: true,
      data: {
        submission
      }
    });
  } catch (error) {
    console.error('Get student submission for assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submission'
    });
  }
};

module.exports = {
  submitAssignment,
  getSubmissionsByAssignment,
  getStudentSubmissions,
  gradeSubmission,
  getStudentSubmissionForAssignment,
  upload
};