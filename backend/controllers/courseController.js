const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Teachers only)
const createCourse = async (req, res) => {
  try {
    const { title, description, duration } = req.body;
    const teacherId = req.user.id; // Assuming middleware adds user to req

    // Validation
    if (!title || !description || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and duration'
      });
    }

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create courses'
      });
    }

    // Create course
    const course = await Course.create({
      title,
      description,
      duration,
      teacher: teacherId
    });

    // Populate teacher info
    await course.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during course creation'
    });
  }
};

// @desc    Get all courses or single course
// @route   GET /api/courses
// @route   GET /api/courses/:courseId
// @access  Public
const getCourses = async (req, res) => {
  try {
    const { courseId } = req.params;

    // If courseId is provided, return single course
    if (courseId) {
      // Check if database is connected
      const mongoose = require('mongoose');
      if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
        // Return demo course when database is not connected
        const demoCourse = {
          _id: courseId,
          title: 'Introduction to Computer Science',
          description: 'Learn the fundamentals of programming, algorithms, and computer systems. This comprehensive course covers fundamental concepts including variables, data types, control structures, functions, and basic algorithms. Students will gain hands-on experience through practical coding exercises and projects.',
          duration: '12 weeks',
          category: 'Computer Science',
          level: 'Beginner to Intermediate',
          language: 'English',
          teacher: {
            _id: '507f1f77bcf86cd799439013',
            name: 'Dr. Demo Teacher',
            email: 'teacher@demo.edu'
          },
          enrolledStudents: [
            {
              _id: '507f1f77bcf86cd799439011',
              name: 'Demo User',
              email: 'demo@example.com'
            }
          ],
          prerequisites: 'Basic computer literacy and high school mathematics',
          skills: [
            'Programming fundamentals',
            'Algorithm design',
            'Problem-solving skills',
            'Code debugging',
            'Software development principles'
          ],
          timeline: [
            { week: 1, title: 'Introduction to Programming', description: 'Basic concepts, setting up development environment' },
            { week: 2, title: 'Variables and Data Types', description: 'Understanding different data types and variable declaration' },
            { week: 3, title: 'Control Structures', description: 'Conditional statements and loops' },
            { week: 4, title: 'Functions and Modules', description: 'Creating reusable code blocks' },
            { week: 5, title: 'Arrays and Collections', description: 'Working with data collections' },
            { week: 6, title: 'Object-Oriented Programming', description: 'Classes, objects, and inheritance' },
            { week: 7, title: 'File I/O Operations', description: 'Reading and writing files' },
            { week: 8, title: 'Error Handling', description: 'Exception handling and debugging' },
            { week: 9, title: 'Data Structures', description: 'Arrays, lists, stacks, and queues' },
            { week: 10, title: 'Algorithms', description: 'Basic sorting and searching algorithms' },
            { week: 11, title: 'Final Project', description: 'Building a complete application' },
            { week: 12, title: 'Review and Assessment', description: 'Course review and final evaluation' }
          ],
          objectives: [
            'Understand fundamental programming concepts',
            'Write clean, efficient, and maintainable code',
            'Apply problem-solving techniques to programming challenges',
            'Develop algorithms for common computational problems',
            'Work effectively with integrated development environments',
            'Debug and troubleshoot programming errors'
          ],
          requirements: [
            'Computer with internet access',
            'Basic typing skills',
            'Commitment to weekly assignments',
            'Willingness to learn and experiment'
          ],
          materials: [
            'Video lectures and coding demonstrations',
            'Interactive coding exercises',
            'Weekly assignments and projects',
            'Discussion forums for peer support',
            'Comprehensive course textbook',
            'Online coding environment access'
          ],
          createdAt: new Date()
        };

        return res.json({
          success: true,
          data: {
            course: demoCourse
          }
        });
      }

      // Database connected - fetch real course
      const course = await Course.findById(courseId)
        .populate('teacher', 'name email')
        .populate('enrolledStudents', 'name email');

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      return res.json({
        success: true,
        data: {
          course
        }
      });
    }

    // Check if database is connected
    const mongoose = require('mongoose');
    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      // Return demo courses when database is not connected
      const demoCourses = [
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Introduction to Computer Science',
          description: 'Learn the fundamentals of programming, algorithms, and computer systems.',
          duration: '12 weeks',
          teacher: {
            _id: '507f1f77bcf86cd799439013',
            name: 'Dr. Demo Teacher',
            email: 'teacher@demo.edu'
          },
          enrolledStudents: [
            {
              _id: '507f1f77bcf86cd799439011',
              name: 'Demo User',
              email: 'demo@example.com'
            }
          ],
          createdAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439014',
          title: 'Web Development Fundamentals',
          description: 'Master the basics of HTML, CSS, and JavaScript.',
          duration: '10 weeks',
          teacher: {
            _id: '507f1f77bcf86cd799439013',
            name: 'Dr. Demo Teacher',
            email: 'teacher@demo.edu'
          },
          enrolledStudents: [],
          createdAt: new Date()
        }
      ];

      return res.json({
        success: true,
        data: {
          courses: demoCourses,
          count: demoCourses.length
        }
      });
    }

    // Database connected - fetch all courses
    const courses = await Course.find({})
      .populate('teacher', 'name email')
      .populate('enrolledStudents', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        courses,
        count: courses.length
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
};

// @desc    Get courses by teacher
// @route   GET /api/courses/teacher/:teacherId
// @access  Private
const getCoursesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Check if database is connected
    const mongoose = require('mongoose');
    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      // Return demo courses for teacher when database is not connected
      const demoCourses = [
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Introduction to Computer Science',
          description: 'Learn the fundamentals of programming, algorithms, and computer systems.',
          duration: '12 weeks',
          teacher: {
            _id: teacherId,
            name: 'Demo Teacher',
            email: 'teacher@demo.edu'
          },
          enrolledStudents: [
            {
              _id: '507f1f77bcf86cd799439011',
              name: 'Demo User',
              email: 'demo@example.com'
            }
          ],
          createdAt: new Date()
        }
      ];

      return res.json({
        success: true,
        data: {
          courses: demoCourses,
          count: demoCourses.length
        }
      });
    }

    const courses = await Course.find({ teacher: teacherId })
      .populate('teacher', 'name email')
      .populate('enrolledStudents', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        courses,
        count: courses.length
      }
    });
  } catch (error) {
    console.error('Get courses by teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher courses'
    });
  }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:courseId/enroll
// @access  Private (Students only)
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Verify user is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can enroll in courses'
      });
    }

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Add student to course
    course.enrolledStudents.push(studentId);
    await course.save();

    // Populate updated course
    await course.populate('teacher', 'name email');
    await course.populate('enrolledStudents', 'name email');

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        course
      }
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during enrollment'
    });
  }
};

// @desc    Get enrolled courses for a student
// @route   GET /api/courses/enrolled
// @access  Private (Students only)
const getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Check if database is connected
    const mongoose = require('mongoose');
    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      // Return demo enrolled courses when database is not connected
      const demoCourses = [
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Introduction to Computer Science',
          description: 'Learn the fundamentals of programming, algorithms, and computer systems.',
          duration: '12 weeks',
          teacher: {
            _id: '507f1f77bcf86cd799439013',
            name: 'Dr. Demo Teacher',
            email: 'teacher@demo.edu'
          },
          enrolledStudents: [
            {
              _id: studentId,
              name: 'Demo User',
              email: 'demo@example.com'
            }
          ],
          createdAt: new Date()
        }
      ];

      return res.json({
        success: true,
        data: {
          courses: demoCourses,
          count: demoCourses.length
        }
      });
    }

    const courses = await Course.find({ enrolledStudents: studentId })
      .populate('teacher', 'name email')
      .populate('enrolledStudents', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        courses,
        count: courses.length
      }
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching enrolled courses'
    });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCoursesByTeacher,
  enrollInCourse,
  getEnrolledCourses
};