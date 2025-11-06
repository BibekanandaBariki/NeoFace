const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  universityId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true  // Automatically convert to uppercase
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true  // Class-specific roll number
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  // New hierarchical structure
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
  currentSemester: {
    type: Number,
    required: true,
    min: 1,
    max: 12  // Support up to PhD programs
  },
  // Legacy fields for backward compatibility (optional)
  department: String,  // Deprecated - use branch instead
  semester: Number,    // Deprecated - use currentSemester
  year: Number,        // Deprecated - use batch
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  // Personal Information
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  contactNumber: String,
  parentContact: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  bloodGroup: String,
  // Academic Information
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  backlogs: {
    type: Number,
    default: 0
  },
  // Face Recognition
  faceEmbedding: [Number],
  faceRegistered: {
    type: Boolean,
    default: false
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null], // allow null explicitly
    default: null // null means face not registered yet
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Compound indexes for efficient queries
studentSchema.index({ campus: 1, batch: 1, section: 1 });
studentSchema.index({ branch: 1, currentSemester: 1 });
studentSchema.index({ universityId: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ batch: 1, branch: 1, section: 1 });

// Virtual for full identification
studentSchema.virtual('fullIdentification').get(function() {
  return `${this.universityId} - ${this.name}`;
});

// Method to check if student is active in current semester
studentSchema.methods.isActiveInSemester = function(semesterNumber) {
  return this.isActive && this.currentSemester === semesterNumber && !this.isDeleted;
};

module.exports = mongoose.model('Student', studentSchema);
