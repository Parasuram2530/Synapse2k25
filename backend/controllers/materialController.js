const Material = require('../models/Material');
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');

// @desc    Upload course material
// @route   POST /api/materials/upload
// @access  Private (Teachers only)
const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, description, courseId, category, tags, isPublic } = req.body;
    const teacherId = req.user.id;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can upload materials'
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
        message: 'You can only upload materials for your own courses'
      });
    }

    // Get file extension and validate
    const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
    const allowedTypes = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov', 'zip', 'rar'];

    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'File type not allowed'
      });
    }

    // Create material record
    const material = await Material.create({
      title,
      description,
      course: courseId,
      uploadedBy: teacherId,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: fileExtension,
      filePath: req.file.path,
      fileUrl: `/uploads/materials/${req.file.filename}`,
      category: category || 'resource',
      isPublic: isPublic === 'true',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    // Populate references
    await material.populate('course', 'title');
    await material.populate('uploadedBy', 'name email');

    // Create notifications for enrolled students
    const notifications = course.enrolledStudents.map(studentId => ({
      recipient: studentId,
      sender: teacherId,
      type: 'material_uploaded',
      title: `New material: ${title}`,
      message: `New ${category || 'material'} uploaded to ${course.title}`,
      relatedCourse: courseId,
      relatedMaterial: material._id
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during material upload'
    });
  }
};

// @desc    Get materials for a course
// @route   GET /api/materials/course/:courseId
// @access  Private
const getMaterialsByCourse = async (req, res) => {
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
        message: 'You do not have access to this course'
      });
    }

    const materials = await Material.find({
      course: courseId,
      $or: [
        { isPublic: true },
        { uploadedBy: userId } // Users can always see their own uploads
      ]
    })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        materials,
        count: materials.length
      }
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching materials'
    });
  }
};

// @desc    Download material
// @route   GET /api/materials/:id/download
// @access  Private
const downloadMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const material = await Material.findById(id).populate('course');
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Verify user has access
    const course = material.course;
    const isTeacher = course.teacher.toString() === userId;
    const isEnrolled = course.enrolledStudents.includes(userId);

    if (!isTeacher && !isEnrolled && !material.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this material'
      });
    }

    // Check if file exists
    if (!fs.existsSync(material.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    material.downloadCount += 1;
    await material.save();

    // Set headers and send file
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${material.originalFileName}"`);

    const fileStream = fs.createReadStream(material.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during download'
    });
  }
};

// @desc    Delete material
// @route   DELETE /api/materials/:id
// @access  Private (Teachers only)
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const material = await Material.findById(id).populate('course');
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Only teachers can delete materials
    if (material.course.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can delete materials'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(material.filePath)) {
      fs.unlinkSync(material.filePath);
    }

    // Delete from database
    await Material.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during material deletion'
    });
  }
};

// @desc    Update material
// @route   PUT /api/materials/:id
// @access  Private (Teachers only)
const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, isPublic } = req.body;
    const userId = req.user.id;

    const material = await Material.findById(id).populate('course');
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Only teachers can update materials
    if (material.course.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can update materials'
      });
    }

    // Update fields
    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    if (category) material.category = category;
    if (tags) material.tags = tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) material.isPublic = isPublic === 'true';

    await material.save();

    await material.populate('uploadedBy', 'name email');

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during material update'
    });
  }
};

module.exports = {
  uploadMaterial,
  getMaterialsByCourse,
  downloadMaterial,
  deleteMaterial,
  updateMaterial
};