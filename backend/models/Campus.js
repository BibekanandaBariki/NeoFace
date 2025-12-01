const mongoose = require('mongoose');

const campusSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true  // PLK, BBS, BLG, etc.
  },
  name: {
    type: String,
    required: true,
    unique: true  // "Paralakhemundi Campus"
  },
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  principal: {
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

campusSchema.index({ code: 1 });
campusSchema.index({ name: 1 });
campusSchema.index({ university: 1 });

module.exports = mongoose.model('Campus', campusSchema);