const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true  // CSE, ECE, MECH, AG, ZOO, etc.
  },
  name: {
    type: String,
    required: true  // "Computer Science and Engineering", "Agriculture"
  },
  shortName: {
    type: String,
    required: true  // "CSE", "Agriculture", "Zoology"
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  campus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campus',
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  hod: {  // Head of Department
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: String,
  intake: {  // Total seats available
    type: Number,
    default: 60
  },
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

// Compound index: One branch per course per program per campus
branchSchema.index({ code: 1, course: 1, program: 1, campus: 1 }, { unique: true });
branchSchema.index({ campus: 1 });
branchSchema.index({ program: 1 });
branchSchema.index({ course: 1 });
branchSchema.index({ university: 1 });
branchSchema.index({ school: 1 });

module.exports = mongoose.model('Branch', branchSchema);