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
    const { university, campus, school, program, course, batch, section, subject, date, timeSlot } = req.query;

    // Validation
    if (!university || !campus || !school || !program || !course || !batch || !section || !subject || !date) {
      return res.status(400).json({ 
        message: 'All parameters are required: university, campus, school, program, course, batch, section, subject, date' 
      });
    }

    // Find the timetable entry
    const timetable = await WeeklyTimetable.findOne({
      subject: subject,
      section: section,
      day: new Date(date).getDay()
    }).populate('subject', 'name code');

    if (!timetable) {
      return res.status(404).json({ 
        message: 'No timetable found for the specified parameters' 
      });
    }

    // Get students in the batch and section
    const students = await Student.find({
      batch: batch,
      section: section,
      isActive: true
    }).select('_id name universityId email');

    // Get attendance records for this session
    const attendanceRecords = await Attendance.find({
      subject: subject,
      date: new Date(date),
      timeSlot: timeSlot || timetable.startTime
    }).select('student status remarks');

    // Create a map of attendance records by student
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.student.toString()] = {
        status: record.status,
        remarks: record.remarks
      };
    });

    // Combine student data with attendance
    const attendanceData = students.map(student => ({
      student: {
        _id: student._id,
        name: student.name,
        universityId: student.universityId,
        email: student.email
      },
      attendance: attendanceMap[student._id.toString()] || {
        status: 'absent',
        remarks: ''
      }
    }));

    res.json({
      message: 'Attendance record retrieved successfully',
      timetable: {
        _id: timetable._id,
        subject: timetable.subject,
        section: timetable.section,
        day: timetable.day,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        room: timetable.room
      },
      date: new Date(date),
      timeSlot: timeSlot || timetable.startTime,
      attendance: attendanceData,
      totalStudents: students.length,
      presentCount: attendanceRecords.filter(record => record.status === 'present').length,
      absentCount: attendanceRecords.filter(record => record.status === 'absent').length
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
    const { subject, date, timeSlot, studentId, newStatus, remarks, overrideReason } = req.body;

    // Validation
    if (!subject || !date || !studentId || !newStatus || !overrideReason) {
      return res.status(400).json({ 
        message: 'Subject, date, studentId, newStatus, and overrideReason are required' 
      });
    }

    // Find existing attendance record
    const existingRecord = await Attendance.findOne({
      subject: subject,
      student: studentId,
      date: new Date(date),
      timeSlot: timeSlot
    });

    if (!existingRecord) {
      return res.status(404).json({ 
        message: 'Attendance record not found' 
      });
    }

    // Archive the original record
    const archivedRecord = {
      originalRecord: existingRecord._id,
      subject: existingRecord.subject,
      student: existingRecord.student,
      date: existingRecord.date,
      timeSlot: existingRecord.timeSlot,
      status: existingRecord.status,
      remarks: existingRecord.remarks,
      overriddenBy: req.user._id,
      overrideReason: overrideReason,
      overrideDate: new Date()
    };

    // Update the attendance record
    existingRecord.status = newStatus;
    existingRecord.remarks = remarks || existingRecord.remarks;
    existingRecord.lastModifiedBy = req.user._id;
    existingRecord.modifiedAt = new Date();
    
    await existingRecord.save();

    res.json({
      message: 'Attendance record overridden successfully',
      updatedRecord: existingRecord,
      archivedData: archivedRecord
    });
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