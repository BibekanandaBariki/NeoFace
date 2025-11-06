const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const WeeklyTimetable = require('../models/WeeklyTimetable');
const Semester = require('../models/Semester');

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
// @desc    Manually mark attendance for a time slot
// @access  Private (Admin, SuperAdmin)
router.post('/manual', [
  auth,
  authorize('admin', 'superadmin')
], async (req, res) => {
  try {
    const { studentId, subjectId, date, status, slotNumber, classStartTime, classEndTime } = req.body;

    if (!studentId || !subjectId || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if already exists for this slot
    const query = {
      studentId,
      subjectId,
      date: attendanceDate
    };
    
    if (slotNumber) {
      query.slotNumber = slotNumber;
    }

    const existing = await Attendance.findOne(query);

    if (existing) {
      const previousStatus = existing.status;
      existing.status = status || 'present';
      existing.markedBy = req.user.role === 'superadmin' ? 'superadmin' : 'admin';
      existing.markedByUser = req.user.id;
      existing.timestamp = new Date();
      existing.updatedAt = new Date();
      
      // Add to edit history
      existing.editHistory.push({
        editedBy: req.user.id,
        editedAt: new Date(),
        previousStatus,
        newStatus: status || 'present',
        reason: req.body.reason || 'Manual update by ' + req.user.role
      });
      
      await existing.save();
      
      const populated = await Attendance.findById(existing._id)
        .populate('studentId', 'name universityId')
        .populate('subjectId', 'code name')
        .populate('markedByUser', 'name role');
      
      return res.json({ message: 'Attendance updated', attendance: populated });
    }

    const attendance = await Attendance.create({
      studentId,
      subjectId,
      date: attendanceDate,
      slotNumber: slotNumber || null,
      classStartTime,
      classEndTime,
      status: status || 'present',
      markedBy: req.user.role === 'superadmin' ? 'superadmin' : 'admin',
      markedByUser: req.user.id,
      timestamp: new Date()
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('studentId', 'name universityId')
      .populate('subjectId', 'code name')
      .populate('markedByUser', 'name role');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`subject-${subjectId}`).emit('attendance-updated', {
        studentId,
        attendance: populated
      });
    }

    res.status(201).json({ message: 'Attendance marked', attendance: populated });
  } catch (error) {
    console.error('Manual attendance error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Attendance already exists for this slot' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/attendance/:id/edit
// @desc    Edit existing attendance (SuperAdmin only)
// @access  SuperAdmin
router.put('/:id/edit', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    const previousStatus = attendance.status;
    
    attendance.status = status;
    attendance.editHistory.push({
      editedBy: req.user.id,
      editedAt: new Date(),
      previousStatus,
      newStatus: status,
      reason: reason || 'Edited by SuperAdmin'
    });
    attendance.updatedAt = new Date();
    
    await attendance.save();
    
    const updated = await Attendance.findById(attendance._id)
      .populate('studentId', 'name universityId')
      .populate('subjectId', 'code name')
      .populate('editHistory.editedBy', 'name role');
    
    res.json({
      message: 'Attendance updated successfully',
      attendance: updated
    });
  } catch (error) {
    console.error('Edit attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/student/:studentId/summary
// @desc    Get attendance summary for a student
// @access  Private
router.get('/student/:studentId/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Check authorization
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || student._id.toString() !== req.params.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const query = { studentId: req.params.studentId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const attendance = await Attendance.find(query)
      .populate('subjectId', 'code name credits');
    
    // Calculate overall statistics
    const totalClasses = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const percentage = totalClasses > 0 ? ((present + late * 0.5) / totalClasses * 100).toFixed(2) : 0;
    
    // Group by subject
    const subjectWise = {};
    attendance.forEach(a => {
      const subId = a.subjectId._id.toString();
      if (!subjectWise[subId]) {
        subjectWise[subId] = {
          subject: a.subjectId,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0
        };
      }
      subjectWise[subId].total++;
      if (a.status === 'present') subjectWise[subId].present++;
      if (a.status === 'absent') subjectWise[subId].absent++;
      if (a.status === 'late') subjectWise[subId].late++;
    });
    
    // Calculate subject-wise percentages
    Object.keys(subjectWise).forEach(key => {
      const sub = subjectWise[key];
      sub.percentage = sub.total > 0 
        ? ((sub.present + sub.late * 0.5) / sub.total * 100).toFixed(2)
        : 0;
    });
    
    res.json({
      overall: {
        total: totalClasses,
        present,
        absent,
        late,
        percentage: parseFloat(percentage)
      },
      subjectWise: Object.values(subjectWise),
      records: attendance
    });
  } catch (error) {
    console.error('Get student summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/student/:studentId/day-wise
// @desc    Get day-wise attendance for a student
// @access  Private
router.get('/student/:studentId/day-wise', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Check authorization
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || student._id.toString() !== req.params.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const query = { studentId: req.params.studentId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const attendance = await Attendance.find(query)
      .populate('subjectId', 'code name')
      .sort({ date: -1 });
    
    // Group by date
    const dayWise = {};
    attendance.forEach(a => {
      const dateKey = a.date.toISOString().split('T')[0];
      if (!dayWise[dateKey]) {
        dayWise[dateKey] = {
          date: a.date,
          classes: [],
          summary: { total: 0, present: 0, absent: 0, late: 0 }
        };
      }
      
      dayWise[dateKey].classes.push({
        subject: a.subjectId,
        slotNumber: a.slotNumber,
        startTime: a.classStartTime,
        endTime: a.classEndTime,
        status: a.status,
        markedBy: a.markedBy,
        confidence: a.confidence
      });
      
      dayWise[dateKey].summary.total++;
      if (a.status === 'present') dayWise[dateKey].summary.present++;
      if (a.status === 'absent') dayWise[dateKey].summary.absent++;
      if (a.status === 'late') dayWise[dateKey].summary.late++;
    });
    
    // Convert to array and sort
    const result = Object.values(dayWise).sort((a, b) => b.date - a.date);
    
    res.json(result);
  } catch (error) {
    console.error('Get day-wise attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/attendance/bulk-mark
// @desc    Mark attendance for multiple students in a slot
// @access  Admin, SuperAdmin
router.post('/bulk-mark', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { students, subjectId, date, slotNumber, classStartTime, classEndTime, defaultStatus } = req.body;
    
    if (!students || !Array.isArray(students) || !subjectId || !date) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    const results = [];
    const errors = [];
    
    for (const item of students) {
      try {
        const studentId = item.studentId || item;
        const status = item.status || defaultStatus || 'present';
        
        const query = {
          studentId,
          subjectId,
          date: attendanceDate
        };
        
        if (slotNumber) query.slotNumber = slotNumber;
        
        const existing = await Attendance.findOne(query);
        
        if (existing) {
          existing.status = status;
          existing.markedBy = req.user.role === 'superadmin' ? 'superadmin' : 'admin';
          existing.markedByUser = req.user.id;
          existing.updatedAt = new Date();
          await existing.save();
          results.push(existing);
        } else {
          const attendance = await Attendance.create({
            studentId,
            subjectId,
            date: attendanceDate,
            slotNumber,
            classStartTime,
            classEndTime,
            status,
            markedBy: req.user.role === 'superadmin' ? 'superadmin' : 'admin',
            markedByUser: req.user.id
          });
          results.push(attendance);
        }
      } catch (err) {
        errors.push({ studentId: item.studentId || item, error: err.message });
      }
    }
    
    res.json({
      message: `Attendance marked for ${results.length} students`,
      success: results.length,
      failed: errors.length,
      errors
    });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

