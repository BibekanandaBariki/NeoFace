const mongoose = require('mongoose');

const weeklyTimetableSchema = new mongoose.Schema({
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
    required: true,
    uppercase: true  // 'A', 'B', 'C'
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  academicYear: {
    type: String,
    required: true
  },
  // Weekly schedule that repeats every week
  schedule: [{
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,  // 0 = Sunday (Indian calendar starts with Sunday)
      max: 6   // 6 = Saturday
    },
    dayName: {
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    slots: [{
      slotNumber: {
        type: Number,
        required: true  // e.g., 1, 2, 3 for period numbers
      },
      startTime: {
        type: String,
        required: true  // e.g., "09:00"
      },
      endTime: {
        type: String,
        required: true  // e.g., "10:00"
      },
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        default: null  // null for breaks/free periods
      },
      subjectCode: String,
      subjectName: String,
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      facultyName: String,
      room: String,
      isBreak: {
        type: Boolean,
        default: false
      },
      breakType: {
        type: String,
        enum: ['short', 'lunch', 'none'],
        default: 'none'
      }
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTill: {
    type: Date,
    default: null  // null means no end date
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

// Compound index for uniqueness and faster queries
weeklyTimetableSchema.index({ 
  campus: 1, 
  batch: 1, 
  section: 1, 
  semester: 1, 
  isActive: 1 
}, { unique: true });

weeklyTimetableSchema.index({ branch: 1, semesterNumber: 1 });
weeklyTimetableSchema.index({ 'schedule.slots.subject': 1 });
weeklyTimetableSchema.index({ 'schedule.slots.faculty': 1 });
weeklyTimetableSchema.index({ campus: 1, isActive: 1 });

// Method to get schedule for a specific date
weeklyTimetableSchema.methods.getScheduleForDate = function(date) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday (matches Indian calendar)
  const daySchedule = this.schedule.find(s => s.dayOfWeek === dayOfWeek);
  return daySchedule || null;
};

// Method to check if timetable is valid for a date
weeklyTimetableSchema.methods.isValidForDate = function(date) {
  if (!this.isActive) return false;
  if (date < this.effectiveFrom) return false;
  if (this.effectiveTill && date > this.effectiveTill) return false;
  return true;
};

module.exports = mongoose.model('WeeklyTimetable', weeklyTimetableSchema);
