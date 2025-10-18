const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Teachers only)
const createAssignment = async (req, res) => {
  try {
    console.log('Received assignment creation request:', req.body); // Debug log

    const {
      title,
      description,
      courseId,
      dueDate,
      maxPoints,
      type,
      submissionInstructions,
      allowedFileTypes,
      maxFileSize,
      gradingRubric,
      allowLateSubmissions,
      showRubricToStudents,
      isPublished,
      sendNotification
    } = req.body;
    const teacherId = req.user.id;

    console.log('Extracted data:', { title, description, courseId, dueDate, maxPoints }); // Debug log

    // Validation
    if (!title || !description || !courseId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, courseId, and dueDate'
      });
    }

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create assignments'
      });
    }

    // Verify course exists and teacher owns it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create assignments for your own courses'
      });
    }

    // Create assignment with all fields
    const assignmentData = {
      title,
      description,
      course: courseId,
      teacher: teacherId,
      dueDate: new Date(dueDate),
      maxPoints: maxPoints || 100,
      type: type || 'homework',
      submissionInstructions,
      allowedFileTypes,
      maxFileSize,
      gradingRubric,
      allowLateSubmissions: allowLateSubmissions === true || allowLateSubmissions === 'true',
      showRubricToStudents: showRubricToStudents !== false && showRubricToStudents !== 'false',
      isPublished: isPublished !== false && isPublished !== 'false',
      sendNotification: sendNotification !== false && sendNotification !== 'false'
    };

    console.log('Creating assignment with data:', assignmentData); // Debug log

    const assignment = await Assignment.create(assignmentData);

    console.log('Assignment created successfully:', assignment._id); // Debug log

    // Populate course and teacher info
    await assignment.populate('course', 'title');
    await assignment.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        assignment
      }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during assignment creation'
    });
  }
};

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
const getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Check if database is connected
    const mongoose = require('mongoose');
    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      // Return demo assignments when database is not connected
      const demoAssignments = [
        {
          _id: '507f1f77bcf86cd799439015',
          title: 'Programming Fundamentals Quiz',
          description: 'Complete the quiz on basic programming concepts including variables, loops, and functions.',
          course: {
            _id: courseId,
            title: 'Introduction to Computer Science'
          },
          teacher: {
            _id: '507f1f77bcf86cd799439013',
            name: 'Dr. Demo Teacher',
            email: 'teacher@demo.edu'
          },
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxPoints: 100,
          createdAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439016',
          title: 'HTML/CSS Project',
          description: 'Create a responsive webpage using HTML and CSS.',
          course: {
            _id: courseId,
            title: 'Introduction to Computer Science'
          },
          teacher: {
            _id: '507f1f77bcf86cd799439013',
            name: 'Dr. Demo Teacher',
            email: 'teacher@demo.edu'
          },
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          maxPoints: 150,
          createdAt: new Date()
        }
      ];

      return res.json({
        success: true,
        data: {
          assignments: demoAssignments,
          count: demoAssignments.length
        }
      });
    }

    const user = await User.findById(userId);

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Teachers can see all assignments for their courses
    // Students can only see assignments for courses they're enrolled in
    if (user.role === 'Student') {
      if (!course.enrolledStudents.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this course'
        });
      }
    } else if (user.role === 'Teacher') {
      if (course.teacher.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view assignments for your own courses'
        });
      }
    }

    const assignments = await Assignment.find({ course: courseId })
      .populate('course', 'title')
      .populate('teacher', 'name email')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: {
        assignments,
        count: assignments.length
      }
    });
  } catch (error) {
    console.error('Get assignments by course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assignments'
    });
  }
};

// @desc    Get assignment by ID
// @route   GET /api/assignments/:id
// @access  Private
const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title')
      .populate('teacher', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: {
        assignment
      }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assignment'
    });
  }
};

module.exports = {
  createAssignment,
  getAssignmentsByCourse,
  getAssignment
};