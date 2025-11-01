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
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  markedBy: {
    type: String,
    enum: ['face-recognition', 'manual', 'admin'],
    default: 'face-recognition'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  classStartTime: String,
  classEndTime: String,
  confidence: {
    type: Number,
    default: 0
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  deviceInfo: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

attendanceSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

