const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
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
  description: String,
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  establishedYear: Number,
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

// Indexes
schoolSchema.index({ code: 1, campus: 1 }, { unique: true });
schoolSchema.index({ name: 1, campus: 1 }, { unique: true });
schoolSchema.index({ university: 1 });
schoolSchema.index({ campus: 1 });

module.exports = mongoose.model('School', schoolSchema);