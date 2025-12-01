const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // Time slot information
  slotNumber: {
    type: Number,
    default: null  // e.g., 1, 2, 3 for period numbers
  },
  classStartTime: String,
  classEndTime: String,
  
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  markedBy: {
    type: String,
    enum: ['face-recognition', 'manual', 'admin', 'superadmin'],
    default: 'face-recognition'
  },
  markedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // User who marked (for manual/admin entries)
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  confidence: {
    type: Number,
    default: 0
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  deviceInfo: String,
  
  // Edit history for admin modifications
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousStatus: String,
    newStatus: String,
    reason: String
  }],
  
  // Semester and timetable reference
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: null
  },
  weeklyTimetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyTimetable',
    default: null
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

// Compound index for uniqueness (student can have multiple attendance per day for different slots)
attendanceSchema.index({ studentId: 1, subjectId: 1, date: 1, slotNumber: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ studentId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

