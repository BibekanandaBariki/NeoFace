const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  shortName: String,  // Abbreviation
  // Hierarchical structure
  campus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campus',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  section: {
    type: String,
    uppercase: true  // 'A', 'B', 'C' - specific section, or null for all
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  // Legacy field for compatibility
  department: String,
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 6
  },
  type: {
    type: String,
    enum: ['theory', 'practical', 'project', 'elective', 'core'],
    default: 'core'
  },
  // Multiple faculty support - one subject can have multiple teachers
  faculty: [{
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'guest'],
      default: 'primary'
    },
    // Teacher is assigned to specific sections only
    assignedSections: [{
      type: String,
      uppercase: true  // ['A', 'B'] - which sections this teacher handles
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  syllabus: {
    totalUnits: Number,
    description: String,
    pdfUrl: String
  },
  timetable: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String,
    room: String,
    section: String  // Which section this slot is for
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes
subjectSchema.index({ campus: 1, branch: 1, semester: 1 });
subjectSchema.index({ batch: 1, section: 1 });
subjectSchema.index({ code: 1 });

// Method to get primary faculty for a section
subjectSchema.methods.getPrimaryFaculty = function(section) {
  const facultyMember = this.faculty.find(f => 
    f.role === 'primary' && 
    (f.assignedSections.includes(section) || f.assignedSections.length === 0)
  );
  return facultyMember ? facultyMember.teacher : null;
};

// Method to check if teacher is assigned
subjectSchema.methods.isTeacherAssigned = function(teacherId) {
  return this.faculty.some(f => f.teacher.toString() === teacherId.toString() && f.isActive);
};

module.exports = mongoose.model('Subject', subjectSchema);

