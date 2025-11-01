const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const { subjectId, startDate, endDate } = req.query;
    
    let query = {};
    let students = [];

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.json({ attendance: 0, totalClasses: 0, subjects: [] });
      }
      query.studentId = student._id;
      students = [student];
    } else if (req.user.role === 'admin') {
      const subjects = await Subject.find({ faculty: req.user._id });
      if (subjectId) {
        query.subjectId = subjectId;
      } else {
        query.subjectId = { $in: subjects.map(s => s._id) };
      }
      const subject = await Subject.findById(subjectId || subjects[0]?._id);
      if (subject) {
        students = await Student.find({ _id: { $in: subject.students } });
      }
    } else if (req.user.role === 'superadmin') {
      if (subjectId) {
        query.subjectId = subjectId;
        const subject = await Subject.findById(subjectId);
        if (subject) {
          students = await Student.find({ _id: { $in: subject.students } });
        }
      }
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendanceRecords = await Attendance.find(query);
    
    // Calculate statistics
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

    // Subject-wise breakdown
    const subjectStats = {};
    for (const record of attendanceRecords) {
      const subId = record.subjectId.toString();
      if (!subjectStats[subId]) {
        const subject = await Subject.findById(subId);
        subjectStats[subId] = {
          subjectId: subId,
          subjectName: subject?.name || 'Unknown',
          total: 0,
          present: 0,
          absent: 0
        };
      }
      subjectStats[subId].total++;
      if (record.status === 'present') {
        subjectStats[subId].present++;
      } else {
        subjectStats[subId].absent++;
      }
    }

    // Daily heatmap data
    const dailyData = {};
    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { present: 0, absent: 0, total: 0 };
      }
      dailyData[dateKey].total++;
      if (record.status === 'present') {
        dailyData[dateKey].present++;
      } else {
        dailyData[dateKey].absent++;
      }
    });

    res.json({
      attendance: Math.round(attendancePercentage * 100) / 100,
      totalClasses,
      presentCount,
      absentCount: totalClasses - presentCount,
      subjects: Object.values(subjectStats),
      dailyHeatmap: dailyData,
      studentCount: students.length
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/student/:studentId
// @desc    Get student-specific analytics
// @access  Private
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Authorization check
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student?._id.toString() !== studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    let query = { studentId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('subjectId', 'code name')
      .sort({ date: -1 });

    const totalClasses = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

    // Subject-wise breakdown
    const subjectBreakdown = {};
    attendance.forEach(record => {
      const subId = record.subjectId._id.toString();
      if (!subjectBreakdown[subId]) {
        subjectBreakdown[subId] = {
          subject: record.subjectId,
          total: 0,
          present: 0,
          absent: 0
        };
      }
      subjectBreakdown[subId].total++;
      if (record.status === 'present') {
        subjectBreakdown[subId].present++;
      } else {
        subjectBreakdown[subId].absent++;
      }
    });

    res.json({
      studentId,
      attendance: Math.round(attendancePercentage * 100) / 100,
      totalClasses,
      presentCount,
      absentCount: totalClasses - presentCount,
      subjectBreakdown: Object.values(subjectBreakdown),
      records: attendance.slice(0, 50) // Last 50 records
    });
  } catch (error) {
    console.error('Student analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

