const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true  // BTECH, BSC, BCOM, MTECH, PHD, etc.
  },
  name: {
    type: String,
    required: true  // "Bachelor of Technology", "Bachelor of Science"
  },
  shortName: {
    type: String,
    required: true  // "B.Tech", "B.Sc", "M.Tech"
  },
  level: {
    type: String,
    required: true,
    enum: ['undergraduate', 'postgraduate', 'diploma', 'phd', 'certificate']
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
  duration: {
    years: {
      type: Number,
      required: true  // 4 for B.Tech, 2 for M.Tech, etc.
    },
    semesters: {
      type: Number,
      required: true  // 8 for B.Tech, 4 for M.Tech
    }
  },
  eligibilityCriteria: String,
  description: String,
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

programSchema.index({ code: 1, campus: 1, school: 1 }, { unique: true });
programSchema.index({ level: 1 });
programSchema.index({ university: 1 });
programSchema.index({ campus: 1 });
programSchema.index({ school: 1 });

module.exports = mongoose.model('Program', programSchema);