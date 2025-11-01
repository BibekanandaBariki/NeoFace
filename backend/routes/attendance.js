const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { subjectId, studentId, startDate, endDate } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.json([]);
      }
      query.studentId = student._id;
    } else if (req.user.role === 'admin') {
      // Admin sees attendance for their subjects
      if (subjectId) {
        query.subjectId = subjectId;
      } else {
        const subjects = await Subject.find({ faculty: req.user._id });
        query.subjectId = { $in: subjects.map(s => s._id) };
      }
    }

    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name universityId')
      .populate('subjectId', 'code name')
      .sort({ date: -1, timestamp: -1 })
      .limit(1000);

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/manual
// @desc    Manually mark attendance
// @access  Private (Admin, SuperAdmin)
router.post('/manual', [
  auth,
  authorize('admin', 'superadmin')
], async (req, res) => {
  try {
    const { studentId, subjectId, date, status } = req.body;

    if (!studentId || !subjectId || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if already exists
    const existing = await Attendance.findOne({
      studentId,
      subjectId,
      date: attendanceDate
    });

    if (existing) {
      existing.status = status || 'present';
      existing.markedBy = 'manual';
      existing.timestamp = new Date();
      await existing.save();
      return res.json(existing);
    }

    const attendance = await Attendance.create({
      studentId,
      subjectId,
      date: attendanceDate,
      status: status || 'present',
      markedBy: 'manual',
      timestamp: new Date()
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('studentId', 'name universityId')
      .populate('subjectId', 'code name');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`subject-${subjectId}`).emit('attendance-updated', {
        studentId,
        attendance: populated
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

