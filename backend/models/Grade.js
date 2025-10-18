const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
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
  overallGrade: {
    type: Number,
    min: [0, 'Overall grade cannot be negative'],
    max: [100, 'Overall grade cannot exceed 100']
  },
  letterGrade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
    default: function() {
      const grade = this.overallGrade;
      if (grade >= 97) return 'A+';
      if (grade >= 93) return 'A';
      if (grade >= 90) return 'A-';
      if (grade >= 87) return 'B+';
      if (grade >= 83) return 'B';
      if (grade >= 80) return 'B-';
      if (grade >= 77) return 'C+';
      if (grade >= 73) return 'C';
      if (grade >= 70) return 'C-';
      if (grade >= 67) return 'D+';
      if (grade >= 63) return 'D';
      if (grade >= 60) return 'D-';
      return 'F';
    }
  },
  gradeBreakdown: [{
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    assignmentTitle: String,
    pointsEarned: Number,
    maxPoints: Number,
    percentage: Number,
    weightedScore: Number
  }],
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  totalPossiblePoints: {
    type: Number,
    default: 0
  },
  gpa: {
    type: Number,
    min: [0, 'GPA cannot be negative'],
    max: [4.0, 'GPA cannot exceed 4.0']
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [500, 'Comments cannot exceed 500 characters']
  },
  isFinal: {
    type: Boolean,
    default: false
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
gradeSchema.index({ student: 1, course: 1 }, { unique: true });
gradeSchema.index({ course: 1 });
gradeSchema.index({ teacher: 1 });

// Calculate GPA based on letter grade
gradeSchema.pre('save', function(next) {
  if (this.letterGrade) {
    const gpaMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };
    this.gpa = gpaMap[this.letterGrade] || 0.0;
  }
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);