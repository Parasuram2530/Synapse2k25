const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maxPoints: {
    type: Number,
    default: 100,
    min: [0, 'Max points cannot be negative']
  },
  type: {
    type: String,
    enum: ['homework', 'quiz', 'project', 'exam', 'presentation', 'lab', 'other'],
    default: 'homework'
  },
  submissionInstructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Submission instructions cannot exceed 1000 characters']
  },
  allowedFileTypes: {
    type: String,
    trim: true,
    maxlength: [200, 'Allowed file types cannot exceed 200 characters']
  },
  maxFileSize: {
    type: Number,
    min: [1, 'Max file size must be at least 1 MB'],
    max: [100, 'Max file size cannot exceed 100 MB']
  },
  gradingRubric: {
    type: String,
    trim: true,
    maxlength: [2000, 'Grading rubric cannot exceed 2000 characters']
  },
  allowLateSubmissions: {
    type: Boolean,
    default: false
  },
  showRubricToStudents: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  sendNotification: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
assignmentSchema.index({ course: 1 });
assignmentSchema.index({ teacher: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);