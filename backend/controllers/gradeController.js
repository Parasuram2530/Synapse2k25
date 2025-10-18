const Grade = require('../models/Grade');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Calculate and create/update overall grade for a student in a course
// @route   POST /api/grades/calculate/:studentId/:courseId
// @access  Private (Teachers only)
const calculateGrade = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const teacherId = req.user.id;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can calculate grades'
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
        message: 'You can only calculate grades for your own courses'
      });
    }

    // Verify student is enrolled
    if (!course.enrolledStudents.includes(studentId)) {
      return res.status(404).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    // Get all assignments for the course
    const assignments = await Assignment.find({ course: courseId });

    // Get all submissions for this student in this course
    const submissions = await Submission.find({
      course: courseId,
      student: studentId
    }).populate('assignment');

    // Calculate grade breakdown
    let totalPointsEarned = 0;
    let totalPossiblePoints = 0;
    const gradeBreakdown = [];

    for (const assignment of assignments) {
      const submission = submissions.find(s => s.assignment._id.toString() === assignment._id.toString());

      if (submission && submission.grade !== undefined) {
        // Student submitted and was graded
        totalPointsEarned += submission.grade;
        totalPossiblePoints += assignment.maxPoints;

        gradeBreakdown.push({
          assignment: assignment._id,
          assignmentTitle: assignment.title,
          pointsEarned: submission.grade,
          maxPoints: assignment.maxPoints,
          percentage: (submission.grade / assignment.maxPoints) * 100,
          weightedScore: submission.grade
        });
      } else {
        // No submission or not graded yet
        totalPossiblePoints += assignment.maxPoints;

        gradeBreakdown.push({
          assignment: assignment._id,
          assignmentTitle: assignment.title,
          pointsEarned: 0,
          maxPoints: assignment.maxPoints,
          percentage: 0,
          weightedScore: 0
        });
      }
    }

    // Calculate overall percentage
    const overallGrade = totalPossiblePoints > 0 ? (totalPointsEarned / totalPossiblePoints) * 100 : 0;

    // Find existing grade or create new one
    let grade = await Grade.findOne({ student: studentId, course: courseId });

    if (grade) {
      // Update existing grade
      grade.overallGrade = overallGrade;
      grade.gradeBreakdown = gradeBreakdown;
      grade.totalPointsEarned = totalPointsEarned;
      grade.totalPossiblePoints = totalPossiblePoints;
    } else {
      // Create new grade
      grade = new Grade({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        overallGrade,
        gradeBreakdown,
        totalPointsEarned,
        totalPossiblePoints
      });
    }

    await grade.save();

    // Populate references for response
    await grade.populate('student', 'name email');
    await grade.populate('course', 'title');
    await grade.populate('teacher', 'name email');

    res.json({
      success: true,
      message: 'Grade calculated successfully',
      data: {
        grade
      }
    });
  } catch (error) {
    console.error('Calculate grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during grade calculation'
    });
  }
};

// @desc    Get student's grade for a course
// @route   GET /api/grades/course/:courseId
// @access  Private (Students only)
const getStudentGrade = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Verify user is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view their grades'
      });
    }

    const grade = await Grade.findOne({
      student: studentId,
      course: courseId
    })
      .populate('course', 'title')
      .populate('teacher', 'name email')
      .populate('gradeBreakdown.assignment', 'title dueDate');

    if (!grade) {
      return res.json({
        success: true,
        message: 'No grade available yet',
        data: {
          grade: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        grade
      }
    });
  } catch (error) {
    console.error('Get student grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching grade'
    });
  }
};

// @desc    Get all grades for a course (Teachers only)
// @route   GET /api/grades/course/:courseId/all
// @access  Private (Teachers only)
const getCourseGrades = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user.id;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can view course grades'
      });
    }

    // Verify course exists and teacher owns it
    const course = await Course.findById(courseId);
    if (!course || course.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view grades for your own courses'
      });
    }

    const grades = await Grade.find({ course: courseId })
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ overallGrade: -1 });

    // Calculate class statistics
    const stats = {
      totalStudents: grades.length,
      averageGrade: grades.length > 0 ? grades.reduce((sum, grade) => sum + grade.overallGrade, 0) / grades.length : 0,
      highestGrade: grades.length > 0 ? Math.max(...grades.map(g => g.overallGrade)) : 0,
      lowestGrade: grades.length > 0 ? Math.min(...grades.map(g => g.overallGrade)) : 0,
      gradeDistribution: {
        'A+': grades.filter(g => g.letterGrade === 'A+').length,
        'A': grades.filter(g => g.letterGrade === 'A').length,
        'A-': grades.filter(g => g.letterGrade === 'A-').length,
        'B+': grades.filter(g => g.letterGrade === 'B+').length,
        'B': grades.filter(g => g.letterGrade === 'B').length,
        'B-': grades.filter(g => g.letterGrade === 'B-').length,
        'C+': grades.filter(g => g.letterGrade === 'C+').length,
        'C': grades.filter(g => g.letterGrade === 'C').length,
        'C-': grades.filter(g => g.letterGrade === 'C-').length,
        'D+': grades.filter(g => g.letterGrade === 'D+').length,
        'D': grades.filter(g => g.letterGrade === 'D').length,
        'D-': grades.filter(g => g.letterGrade === 'D-').length,
        'F': grades.filter(g => g.letterGrade === 'F').length
      }
    };

    res.json({
      success: true,
      data: {
        grades,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get course grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course grades'
    });
  }
};

// @desc    Update grade comments or mark as final
// @route   PUT /api/grades/:gradeId
// @access  Private (Teachers only)
const updateGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { comments, isFinal } = req.body;
    const teacherId = req.user.id;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can update grades'
      });
    }

    const grade = await Grade.findById(gradeId);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    // Verify teacher owns the course
    const course = await Course.findById(grade.course);
    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update grades for your own courses'
      });
    }

    // Update fields
    if (comments !== undefined) grade.comments = comments;
    if (isFinal !== undefined) grade.isFinal = isFinal;

    await grade.save();

    await grade.populate('student', 'name email');
    await grade.populate('course', 'title');

    res.json({
      success: true,
      message: 'Grade updated successfully',
      data: {
        grade
      }
    });
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during grade update'
    });
  }
};

module.exports = {
  calculateGrade,
  getStudentGrade,
  getCourseGrades,
  updateGrade
};