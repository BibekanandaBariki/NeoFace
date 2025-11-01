const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const faceRecognitionService = require('../services/faceRecognition');

const router = express.Router();

// @route   POST /api/face/register
// @desc    Register face embedding for student
// @access  Private (Student)
router.post('/register', auth, authorize('student'), async (req, res) => {
  try {
    const { imageData, frames } = req.body;

    if (!imageData || !frames || frames.length < 5) {
      return res.status(400).json({ message: 'Insufficient face frames. Need at least 5 frames with head rotation.' });
    }

    // Process frames and generate embedding
    const embedding = await faceRecognitionService.generateEmbedding(imageData, frames);

    if (!embedding) {
      return res.status(400).json({ message: 'Face detection failed. Please ensure your face is clearly visible.' });
    }

    // Update user with face embedding
    await User.findByIdAndUpdate(req.user._id, {
      faceEmbedding: embedding,
      faceRegistered: true
    });

    // Update student record if exists
    await Student.findOneAndUpdate(
      { userId: req.user._id },
      { faceEmbedding: embedding, faceRegistered: true, registrationStatus: 'pending' }
    );

    res.json({ 
      message: 'Face registered successfully. Waiting for admin approval.',
      faceRegistered: true 
    });
  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({ message: 'Face registration failed', error: error.message });
  }
});

// @route   POST /api/face/recognize
// @desc    Recognize face and mark attendance
// @access  Private
router.post('/recognize', auth, async (req, res) => {
  try {
    const { imageData, subjectId, location } = req.body;

    if (!imageData || !subjectId) {
      return res.status(400).json({ message: 'Image data and subject ID are required' });
    }

    // Get all registered students for the subject
    const Subject = require('../models/Subject');
    const subject = await Subject.findById(subjectId).populate('students');
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Get embeddings from database - only students enrolled in this subject
    const studentEmbeddings = await Student.find({
      _id: { $in: subject.students },
      faceRegistered: true,
      registrationStatus: 'approved',
      faceEmbedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    }).select('faceEmbedding universityId name userId');

    if (studentEmbeddings.length === 0) {
      return res.status(404).json({ 
        message: 'No registered students found for this subject. Please ensure students have registered and been approved.' 
      });
    }

    // Filter out students without valid embeddings
    const validEmbeddings = studentEmbeddings.filter(s => 
      s.faceEmbedding && 
      Array.isArray(s.faceEmbedding) && 
      s.faceEmbedding.length > 0
    );

    if (validEmbeddings.length === 0) {
      return res.status(404).json({ 
        message: 'No valid face embeddings found for students in this subject' 
      });
    }

    console.log(`Attempting face recognition with ${validEmbeddings.length} registered students`);

    // Prepare student data for recognition
    const studentDataForRecognition = validEmbeddings.map(s => {
      // Ensure embedding is properly formatted
      let embedding = s.faceEmbedding;
      if (!Array.isArray(embedding)) {
        console.log(`Warning: Student ${s.name} embedding is not an array`);
        return null;
      }
      if (embedding.length === 0) {
        console.log(`Warning: Student ${s.name} has empty embedding`);
        return null;
      }
      return {
        embedding: embedding,
        studentId: s._id.toString(),
        userId: s.userId ? s.userId.toString() : null,
        name: s.name,
        universityId: s.universityId
      };
    }).filter(s => s !== null); // Remove invalid entries

    if (studentDataForRecognition.length === 0) {
      return res.status(404).json({ 
        message: 'No valid face embeddings available for recognition' 
      });
    }

    console.log(`Attempting recognition with ${studentDataForRecognition.length} valid student embeddings`);

    // Recognize face
    const recognition = await faceRecognitionService.recognizeFace(
      imageData,
      studentDataForRecognition
    );

    if (!recognition) {
      console.log('Face recognition failed - no match found above threshold');
      return res.status(404).json({ 
        message: 'Face not recognized. Please ensure you are registered for this subject and try again.' 
      });
    }

    console.log(`Face recognized: ${recognition.name} (${recognition.universityId}) with confidence: ${recognition.confidence}`);

    // Check if attendance already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      studentId: recognition.studentId,
      subjectId: subjectId,
      date: { $gte: today }
    });

    if (existingAttendance) {
      return res.json({
        message: 'Attendance already marked',
        attendance: existingAttendance,
        recognized: recognition
      });
    }

    // Mark attendance
    const attendance = await Attendance.create({
      studentId: recognition.studentId,
      subjectId: subjectId,
      date: new Date(),
      status: 'present',
      markedBy: 'face-recognition',
      confidence: recognition.confidence,
      location: location || null,
      timestamp: new Date()
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`subject-${subjectId}`).emit('attendance-updated', {
        studentId: recognition.studentId,
        studentName: recognition.name,
        attendance
      });
    }

    res.json({
      message: 'Attendance marked successfully',
      attendance,
      recognized: {
        name: recognition.name,
        universityId: recognition.universityId,
        confidence: recognition.confidence
      }
    });
  } catch (error) {
    console.error('Face recognition error:', error);
    res.status(500).json({ message: 'Face recognition failed', error: error.message });
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
    const embedding = await faceRecognitionService.generateEmbedding(imageData, frames);

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

