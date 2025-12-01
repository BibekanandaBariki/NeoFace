const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin', 'campusadmin', 'hod'],
    default: 'student'
  },
  universityId: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  // For faculty/admin - which campus they belong to
  assignedCampus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campus'
  },
  // For faculty - which branches they can teach
  assignedBranches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }],
  // For HOD role
  managedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  employeeId: String,  // For staff identification
  department: String,  // Legacy field
  isVerified: {
    type: Boolean,
    default: false
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
  faceEmbedding: {
    type: [Number],
    default: null
  },
  faceRegistered: {
    type: Boolean,
    default: false
  },
  profileImage: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);

