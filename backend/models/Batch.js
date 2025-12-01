const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true  // "2024-2028" for 4-year program
  },
  admissionYear: {
    type: Number,
    required: true  // 2024
  },
  passOutYear: {
    type: Number,
    required: true  // 2028
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
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
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
  totalStudents: {
    type: Number,
    default: 0
  },
  numberOfSections: {
    type: Number,
    default: 1,
    min: 1
  },
  sections: [{
    type: String  // ['A', 'B', 'C']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  currentSemester: {
    type: Number,
    default: 1  // Automatically tracks which semester students are in
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

// Compound index: One batch per branch per campus per year
batchSchema.index({ year: 1, branch: 1, campus: 1 }, { unique: true });
batchSchema.index({ campus: 1 });
batchSchema.index({ branch: 1 });
batchSchema.index({ course: 1 });
batchSchema.index({ program: 1 });
batchSchema.index({ university: 1 });
batchSchema.index({ school: 1 });
batchSchema.index({ admissionYear: 1 });

// Method to check if batch is current
batchSchema.methods.isCurrent = function() {
  const currentYear = new Date().getFullYear();
  return currentYear >= this.admissionYear && currentYear <= this.passOutYear;
};

module.exports = mongoose.model('Batch', batchSchema);