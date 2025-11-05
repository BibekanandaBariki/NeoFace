const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const faceService = require('../services/faceRecognition');

const router = express.Router();

// @route   POST /api/face/register
// @desc    Register face embedding for student
// @access  Private (Student)
router.post('/register', auth, authorize('student'), async (req, res) => {
  try {
    const { frames } = req.body;
    if (!frames || !Array.isArray(frames) || frames.length < 3) {
      return res.status(400).json({ message: 'Please provide at least 3 frames.' });
    }

    const embedding = await faceService.generateEmbedding(null, frames);
    if (!embedding) {
      return res.status(500).json({ message: 'Failed to generate face embedding. Ensure image quality.' });
    }

    // Persist to User and Student records
    await User.findByIdAndUpdate(req.user._id, {
      faceEmbedding: embedding,
      faceRegistered: true
    });

    await Student.findOneAndUpdate({ userId: req.user._id }, {
      faceEmbedding: embedding,
      faceRegistered: true,
      registrationStatus: 'pending'
    });

    return res.json({ message: 'Face registered successfully. Await admin approval.', faceRegistered: true });
  } catch (error) {
    console.error('face register error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/face/recognize
// @desc    Recognize face and mark attendance
// @access  Private
router.post('/recognize', auth, async (req, res) => {
  try {
    const { imageData, subjectId, location } = req.body;
    if (!imageData || !subjectId) {
      return res.status(400).json({ message: 'Image and subjectId required' });
    }

    const subject = await Subject.findById(subjectId).populate('students');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Prepare students eligible for recognition
    const candidates = await Student.find({
      _id: { $in: subject.students },
      faceRegistered: true,
      registrationStatus: 'approved',
      faceEmbedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    }).select('faceEmbedding userId universityId name');

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ message: 'No approved students with embeddings in this subject' });
    }

    // Use service to recognize
    const result = await faceService.recognizeFace(imageData, candidates);
    if (!result) {
      return res.status(404).json({ message: 'Face not recognized' });
    }

    const matchedStudent = result.student;
    const confidence = result.confidence;

    // Mark attendance (avoid duplicates)
    const today = new Date();
    today.setHours(0,0,0,0);

    let existing = await Attendance.findOne({
      studentId: matchedStudent._id,
      subjectId,
      date: today
    });

    if (existing) {
      return res.json({ message: 'Attendance already marked for today', attendance: existing });
    }

    const attendance = await Attendance.create({
      studentId: matchedStudent._id,
      subjectId,
      date: today,
      status: 'present',
      markedBy: 'face-recognition',
      timestamp: new Date(),
      location: location || null,
      confidence
    });

    const populated = await Attendance.findById(attendance._id).populate('studentId', 'name universityId');

    // Emit realtime update
    const io = req.app.get('io');
    if (io) {
      io.to(`subject-${subjectId}`).emit('attendance-updated', { studentId: matchedStudent._id, attendance: populated });
    }

    return res.json({
      message: 'Attendance marked successfully',
      recognized: { name: matchedStudent.name, universityId: matchedStudent.universityId },
      confidence,
      attendance: populated
    });
  } catch (error) {
    console.error('face recognize error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/face/approve/:studentId
// @desc    Approve student face registration
// @access  Private (Admin, SuperAdmin)
router.post('/approve/:studentId', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student record - ensure faceRegistered is true when approved
    student.registrationStatus = 'approved';
    student.faceRegistered = true;
    await student.save();

    // Update user record
    await User.findByIdAndUpdate(student.userId, {
      faceRegistered: true,
      isVerified: true
    });

    res.json({ message: 'Face registration approved', student });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/face/update/:studentId
// @desc    Update/replace student face data (SuperAdmin only)
// @access  Private (SuperAdmin only)
router.put('/update/:studentId', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { imageData, frames } = req.body;

    if (!imageData || !frames || frames.length < 5) {
      return res.status(400).json({ message: 'Insufficient face frames. Need at least 5 frames with head rotation.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Generate new embedding
    const embedding = await faceService.generateEmbedding(imageData, frames);

    if (!embedding) {
      return res.status(400).json({ message: 'Face detection failed. Please ensure face is clearly visible.' });
    }

    // Update student record
    student.faceEmbedding = embedding;
    student.faceRegistered = true;
    student.registrationStatus = 'approved'; // Auto-approve when updated by SuperAdmin
    await student.save();

    // Update user record
    await User.findByIdAndUpdate(student.userId, {
      faceEmbedding: embedding,
      faceRegistered: true,
      isVerified: true
    });

    res.json({ 
      message: 'Face data updated successfully',
      student: {
        _id: student._id,
        name: student.name,
        faceRegistered: student.faceRegistered,
        registrationStatus: student.registrationStatus
      }
    });
  } catch (error) {
    console.error('Update face data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/face/reject/:studentId
// @desc    Reject student face registration
// @access  Private (Admin, SuperAdmin)
router.post('/reject/:studentId', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.registrationStatus = 'rejected';
    student.faceRegistered = false;
    student.faceEmbedding = null;
    await student.save();

    // Update user record
    await User.findByIdAndUpdate(student.userId, {
      faceRegistered: false,
      faceEmbedding: null
    });

    res.json({ message: 'Face registration rejected', student });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

