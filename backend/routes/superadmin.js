const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const WeeklyTimetable = require('../models/WeeklyTimetable');
const User = require('../models/User');
const University = require('../models/University');
const Campus = require('../models/Campus');
const School = require('../models/School');
const Program = require('../models/Program');
const Course = require('../models/Course');
const Batch = require('../models/Batch');

// @route   GET /api/superadmin/attendance/record
// @desc    Get specific attendance record for override
// @access  SuperAdmin only
router.get('/attendance/record', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { batch, section, subjectId, date, slotNumber } = req.query;

    if (!batch || !section || !subjectId || !date) {
      return res.status(400).json({
        message: 'Required parameters: batch, section, subjectId, date'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Students in the batch and section
    const students = await Student.find({
      batch,
      section,
      isActive: true,
      isDeleted: false
    }).select('_id name universityId email');

    // Attendance for the given subject/date[/slot]
    const attQuery = {
      subjectId: subjectId,
      date: attendanceDate
    };
    if (slotNumber) attQuery.slotNumber = parseInt(slotNumber, 10);

    const attendanceRecords = await Attendance.find(attQuery)
      .select('studentId status editHistory')
      .populate('studentId', 'name universityId');

    const attendanceMap = new Map();
    for (const rec of attendanceRecords) {
      attendanceMap.set(rec.studentId._id.toString(), {
        status: rec.status,
        remarks: rec.editHistory?.length ? rec.editHistory[rec.editHistory.length - 1]?.reason : ''
      });
    }

    const attendanceData = students.map(stu => ({
      student: {
        _id: stu._id,
        name: stu.name,
        universityId: stu.universityId,
        email: stu.email
      },
      attendance: attendanceMap.get(stu._id.toString()) || { status: 'absent', remarks: '' }
    }));

    res.json({
      message: 'Attendance record retrieved successfully',
      date: attendanceDate,
      slotNumber: slotNumber ? parseInt(slotNumber, 10) : null,
      attendance: attendanceData,
      totalStudents: students.length,
      presentCount: attendanceRecords.filter(r => r.status === 'present').length,
      absentCount: students.length - attendanceRecords.filter(r => r.status === 'present').length
    });
  } catch (error) {
    console.error('Get attendance record error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/superadmin/attendance/override
// @desc    Override attendance record
// @access  SuperAdmin only
router.put('/attendance/override', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { subjectId, date, slotNumber, studentId, newStatus, remarks, overrideReason } = req.body;

    if (!subjectId || !date || !studentId || !newStatus || !overrideReason) {
      return res.status(400).json({
        message: 'subjectId, date, studentId, newStatus, and overrideReason are required'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const findQuery = {
      subjectId,
      studentId,
      date: attendanceDate
    };
    if (slotNumber !== undefined && slotNumber !== null) {
      findQuery.slotNumber = slotNumber;
    }

    const existingRecord = await Attendance.findOne(findQuery);

    if (!existingRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const previousStatus = existingRecord.status;
    existingRecord.status = newStatus;
    existingRecord.markedBy = 'superadmin';
    existingRecord.markedByUser = req.user._id;
    existingRecord.timestamp = new Date();
    existingRecord.updatedAt = new Date();
    existingRecord.editHistory.push({
      editedBy: req.user._id,
      editedAt: new Date(),
      previousStatus,
      newStatus,
      reason: overrideReason
    });

    if (remarks) {
      // store remarks in latest edit history entry's reason concatenated
      existingRecord.editHistory[existingRecord.editHistory.length - 1].reason = overrideReason + (remarks ? ` | ${remarks}` : '');
    }

    await existingRecord.save();

    const updated = await Attendance.findById(existingRecord._id)
      .populate('studentId', 'name universityId')
      .populate('subjectId', 'code name')
      .populate('markedByUser', 'name role');

    res.json({ message: 'Attendance record overridden successfully', updatedRecord: updated });
  } catch (error) {
    console.error('Override attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/superadmin/requests
// @desc    Get pending requests for SuperAdmin approval
// @access  SuperAdmin only
router.get('/requests', auth, authorize('superadmin'), async (req, res) => {
  try {
    // In a real implementation, this would fetch pending requests from a requests collection
    // For now, we'll return a placeholder response
    res.json({
      message: 'Pending requests retrieved successfully',
      requests: [],
      count: 0
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/superadmin/requests/:id/approve
// @desc    Approve a request
// @access  SuperAdmin only
router.post('/requests/:id/approve', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { comment } = req.body;
    
    // In a real implementation, this would approve a request in the requests collection
    // For now, we'll return a placeholder response
    res.json({
      message: 'Request approved successfully',
      requestId: req.params.id,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      comment: comment
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/superadmin/requests/:id/deny
// @desc    Deny a request
// @access  SuperAdmin only
router.post('/requests/:id/deny', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { comment } = req.body;
    
    // In a real implementation, this would deny a request in the requests collection
    // For now, we'll return a placeholder response
    res.json({
      message: 'Request denied successfully',
      requestId: req.params.id,
      deniedBy: req.user._id,
      deniedAt: new Date(),
      comment: comment
    });
  } catch (error) {
    console.error('Deny request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;