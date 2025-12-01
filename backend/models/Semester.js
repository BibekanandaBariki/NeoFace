const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true  // "Semester 1 - Fall 2024"
  },
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 12  // Support PhD programs
  },
  academicYear: {
    type: String,
    required: true  // "2024-2025"
  },
  term: {
    type: String,
    enum: ['fall', 'spring', 'summer', 'winter', 'annual'],
    default: 'annual'
  },
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
    uppercase: true  // 'A', 'B', 'C' - specific section
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCurrent: {
    type: Boolean,
    default: false  // Only one semester should be current per section
  },
  holidays: [{
    date: Date,
    name: String,
    type: {
      type: String,
      enum: ['national', 'regional', 'university', 'campus', 'other'],
      default: 'other'
    },
    description: String
  }],
  examSchedule: {
    midTermStart: Date,
    midTermEnd: Date,
    finalTermStart: Date,
    finalTermEnd: Date
  },
  attendancePolicy: {
    minimumPercentage: {
      type: Number,
      default: 75  // Minimum attendance required
    },
    gracePeriod: {
      type: Number,
      default: 7  // Days of grace period
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Compound index for uniqueness - one semester per batch per section
semesterSchema.index({ 
  semesterNumber: 1, 
  academicYear: 1, 
  batch: 1, 
  section: 1 
}, { unique: true });

// Additional indexes
semesterSchema.index({ campus: 1, isCurrent: 1 });
semesterSchema.index({ batch: 1, semesterNumber: 1 });
semesterSchema.index({ isActive: 1, isCurrent: 1 });

// Method to check if date is within semester
semesterSchema.methods.isDateInSemester = function(date) {
  return date >= this.startDate && date <= this.endDate;
};

// Method to check if date is a holiday
semesterSchema.methods.isHoliday = function(date) {
  const dateStr = date.toISOString().split('T')[0];
  return this.holidays.some(h => h.date.toISOString().split('T')[0] === dateStr);
};

// Method to check if within exam period
semesterSchema.methods.isExamPeriod = function(date) {
  if (!this.examSchedule) return false;
  
  const isMidTerm = this.examSchedule.midTermStart && this.examSchedule.midTermEnd &&
    date >= this.examSchedule.midTermStart && date <= this.examSchedule.midTermEnd;
  
  const isFinalTerm = this.examSchedule.finalTermStart && this.examSchedule.finalTermEnd &&
    date >= this.examSchedule.finalTermStart && date <= this.examSchedule.finalTermEnd;
  
  return isMidTerm || isFinalTerm;
};

module.exports = mongoose.model('Semester', semesterSchema);
