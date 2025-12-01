const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Program = require('../models/Program');
const School = require('../models/School');
const Campus = require('../models/Campus');
const University = require('../models/University');

// @route   GET /api/examination/check-eligibility
// @desc    Check student eligibility for examination based on attendance
// @access  Campus Admin, SuperAdmin
router.get('/check-eligibility', auth, authorize('campusadmin', 'superadmin'), async (req, res) => {
  try {
    const { university, campus, school, program, course, batch, semester } = req.query;

    // Validation
    if (!university || !campus || !school || !program || !course || !batch || !semester) {
      return res.status(400).json({ 
        message: 'All parameters are required: university, campus, school, program, course, batch, semester' 
      });
    }

    // Fetch students for the batch
    const students = await Student.find({ 
      batch: batch,
      isActive: true,
      isDeleted: false
    }).select('_id name universityId email');

    // Determine branch from batch and fetch subjects for that branch and semester
    const batchDoc = await Batch.findById(batch).select('branch');
    if (!batchDoc) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    const subjects = await Subject.find({ 
      branch: batchDoc.branch,
      semester: parseInt(semester, 10),
      isActive: true
    }).select('_id code name');

    // Check eligibility for each student
    const eligibleStudents = [];
    const ineligibleStudents = [];

    for (const student of students) {
      // Calculate overall attendance
      let totalClasses = 0;
      let totalPresent = 0;
      let subjectAttendances = [];

      for (const subject of subjects) {
        // Get attendance records for this student and subject
        const attendanceRecords = await Attendance.find({
          studentId: student._id,
          subjectId: subject._id
        });

        const subjectTotalClasses = attendanceRecords.length;
        const subjectPresent = attendanceRecords.filter(record => record.status === 'present').length;
        const subjectPercentage = subjectTotalClasses > 0 ? (subjectPresent / subjectTotalClasses) * 100 : 0;

        totalClasses += subjectTotalClasses;
        totalPresent += subjectPresent;

        subjectAttendances.push({
          subject: subject._id,
          subjectCode: subject.code,
          subjectName: subject.name,
          totalClasses: subjectTotalClasses,
          present: subjectPresent,
          percentage: subjectPercentage
        });
      }

      const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

      // Check eligibility (75% overall and 75% in each subject)
      const isEligible = overallPercentage >= 75 && 
                        subjectAttendances.every(subject => subject.percentage >= 75);

      const studentData = {
        _id: student._id,
        name: student.name,
        universityId: student.universityId,
        email: student.email,
        overallAttendancePercentage: overallPercentage,
        subjectAttendances: subjectAttendances
      };

      if (isEligible) {
        eligibleStudents.push(studentData);
      } else {
        // Determine ineligibility reason
        let reason = '';
        if (overallPercentage < 75) {
          reason = `Overall attendance: ${overallPercentage.toFixed(1)}% (below 75%)`;
        } else {
          const belowSubject = subjectAttendances.find(subject => subject.percentage < 75);
          if (belowSubject) {
            reason = `${belowSubject.subjectName}: ${belowSubject.percentage.toFixed(1)}% (below 75%)`;
          }
        }

        ineligibleStudents.push({
          ...studentData,
          ineligibilityReason: reason
        });
      }
    }

    res.json({
      message: 'Eligibility check completed',
      eligibleStudents,
      ineligibleStudents,
      summary: {
        totalStudents: students.length,
        eligibleCount: eligibleStudents.length,
        ineligibleCount: ineligibleStudents.length,
        eligibilityRate: students.length > 0 ? (eligibleStudents.length / students.length) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/examination/generate-admit-cards
// @desc    Generate admit cards for eligible students
// @access  Campus Admin, SuperAdmin
router.post('/generate-admit-cards', auth, authorize('campusadmin', 'superadmin'), async (req, res) => {
  try {
    const { studentIds, filters } = req.body;

    // Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ 
        message: 'Student IDs are required' 
      });
    }

    if (!filters) {
      return res.status(400).json({ 
        message: 'Filters are required' 
      });
    }

    // Fetch student details
    const students = await Student.find({
      _id: { $in: studentIds },
      isActive: true
    }).select('_id name universityId email rollNumber batch');

    if (students.length === 0) {
      return res.status(404).json({ 
        message: 'No valid students found' 
      });
    }

    // Fetch batch details
    const batch = await Batch.findById(filters.batch)
      .populate('course', 'name code')
      .populate('program', 'name shortName')
      .populate('campus', 'name code');

    if (!batch) {
      return res.status(404).json({ 
        message: 'Batch not found' 
      });
    }

    // Generate admit card data
    const admitCards = students.map(student => ({
      studentId: student._id,
      studentName: student.name,
      universityId: student.universityId,
      email: student.email,
      rollNumber: student.rollNumber,
      batch: batch.year,
      course: batch.course?.name,
      program: batch.program?.shortName,
      campus: batch.campus?.name,
      semester: filters.semester,
      examDate: new Date(), // This would be set based on actual exam schedule
      examTime: '09:00 AM - 12:00 PM', // This would be set based on actual exam schedule
      venue: `${batch.campus?.name} Examination Hall`, // This would be set based on actual venue
      instructions: [
        'Bring your admit card and valid ID proof',
        'Arrive 30 minutes before the exam',
        'No mobile phones or electronic devices allowed',
        'Follow all examination guidelines'
      ]
    }));

    // In a real implementation, this would generate PDF files and return a download link
    // For now, we'll return the data and simulate a download URL
    const downloadUrl = `/api/examination/admit-cards/download?batch=${filters.batch}&semester=${filters.semester}`;

    res.json({
      message: `${admitCards.length} admit cards generated successfully`,
      admitCards,
      downloadUrl,
      count: admitCards.length
    });
  } catch (error) {
    console.error('Generate admit cards error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/examination/admit-cards/download
// @desc    Download generated admit cards (placeholder)
// @access  Campus Admin, SuperAdmin
router.get('/admit-cards/download', auth, authorize('campusadmin', 'superadmin'), async (req, res) => {
  try {
    // In a real implementation, this would generate and return a ZIP file with PDF admit cards
    // For now, we'll return a placeholder response
    res.json({
      message: 'Admit cards download endpoint',
      note: 'In a full implementation, this would return a ZIP file with PDF admit cards'
    });
  } catch (error) {
    console.error('Download admit cards error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;