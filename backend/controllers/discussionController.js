const Discussion = require('../models/Discussion');
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new discussion post
// @route   POST /api/discussions
// @access  Private
const createDiscussion = async (req, res) => {
  try {
    const { title, content, courseId, isAnnouncement, tags } = req.body;
    const authorId = req.user.id;

    // Verify user is enrolled in course or is teacher
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const user = await User.findById(authorId);
    const isTeacher = course.teacher.toString() === authorId;
    const isEnrolled = course.enrolledStudents.includes(authorId);

    if (!isTeacher && !isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to post'
      });
    }

    // Only teachers can create announcements
    if (isAnnouncement && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create announcements'
      });
    }

    const discussion = await Discussion.create({
      title,
      content,
      course: courseId,
      author: authorId,
      isAnnouncement: isAnnouncement || false,
      tags: tags || []
    });

    // Populate references
    await discussion.populate('course', 'title');
    await discussion.populate('author', 'name email');

    // Create notifications for enrolled students (excluding author)
    if (!isAnnouncement) {
      const enrolledStudents = course.enrolledStudents.filter(id => id.toString() !== authorId);
      const notifications = enrolledStudents.map(studentId => ({
        recipient: studentId,
        sender: authorId,
        type: 'discussion_post',
        title: `New discussion: ${title}`,
        message: `${user.name} started a new discussion in ${course.title}`,
        relatedCourse: courseId,
        relatedDiscussion: discussion._id
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } else {
      // Announcement notification for all enrolled students
      const notifications = course.enrolledStudents.map(studentId => ({
        recipient: studentId,
        sender: authorId,
        type: 'announcement',
        title: `Announcement: ${title}`,
        message: `New announcement in ${course.title}`,
        relatedCourse: courseId,
        relatedDiscussion: discussion._id,
        priority: 'high'
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      data: {
        discussion
      }
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during discussion creation'
    });
  }
};

// @desc    Get discussions for a course
// @route   GET /api/discussions/course/:courseId
// @access  Private
const getDiscussionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Verify user has access to course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const isTeacher = course.teacher.toString() === userId;
    const isEnrolled = course.enrolledStudents.includes(userId);

    if (!isTeacher && !isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const discussions = await Discussion.find({ course: courseId })
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .sort({ isPinned: -1, isAnnouncement: -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        discussions,
        count: discussions.length
      }
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching discussions'
    });
  }
};

// @desc    Add reply to discussion
// @route   POST /api/discussions/:id/reply
// @access  Private
const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    const discussion = await Discussion.findById(id).populate('course');
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    if (discussion.isClosed) {
      return res.status(400).json({
        success: false,
        message: 'This discussion is closed'
      });
    }

    // Verify user has access
    const course = discussion.course;
    const isTeacher = course.teacher.toString() === authorId;
    const isEnrolled = course.enrolledStudents.includes(authorId);

    if (!isTeacher && !isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this discussion'
      });
    }

    const reply = {
      content,
      author: authorId,
      createdAt: new Date()
    };

    discussion.replies.push(reply);
    await discussion.save();

    // Populate the new reply
    await discussion.populate('replies.author', 'name email');

    const newReply = discussion.replies[discussion.replies.length - 1];

    // Create notification for discussion author (if not the replier)
    if (discussion.author.toString() !== authorId) {
      const user = await User.findById(authorId);
      await Notification.create({
        recipient: discussion.author,
        sender: authorId,
        type: 'discussion_reply',
        title: `Reply to: ${discussion.title}`,
        message: `${user.name} replied to your discussion`,
        relatedCourse: course._id,
        relatedDiscussion: discussion._id
      });
    }

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: {
        reply: newReply
      }
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during reply creation'
    });
  }
};

// @desc    Update discussion (pin/unpin/close)
// @route   PUT /api/discussions/:id
// @access  Private (Teachers only)
const updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned, isClosed } = req.body;
    const userId = req.user.id;

    const discussion = await Discussion.findById(id).populate('course');
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Only teachers can update discussions
    if (discussion.course.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can update discussions'
      });
    }

    if (isPinned !== undefined) discussion.isPinned = isPinned;
    if (isClosed !== undefined) discussion.isClosed = isClosed;

    await discussion.save();

    res.json({
      success: true,
      message: 'Discussion updated successfully',
      data: {
        discussion
      }
    });
  } catch (error) {
    console.error('Update discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during discussion update'
    });
  }
};

module.exports = {
  createDiscussion,
  getDiscussionsByCourse,
  addReply,
  updateDiscussion
};