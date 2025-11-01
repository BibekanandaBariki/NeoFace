const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');

const router = express.Router();

// @route   GET /api/timetable
// @desc    Get timetable
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let subjects = [];

    if (req.user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id })
        .populate('subjects');
      
      if (student && student.subjects.length > 0) {
        subjects = await Subject.find({ _id: { $in: student.subjects } })
          .populate('faculty', 'name email');
      }
    } else if (req.user.role === 'admin') {
      subjects = await Subject.find({ faculty: req.user._id })
        .populate('faculty', 'name email');
    } else if (req.user.role === 'superadmin') {
      subjects = await Subject.find()
        .populate('faculty', 'name email');
    }

    // Format as timetable
    const timetable = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach(day => {
      timetable[day] = [];
    });

    subjects.forEach(subject => {
      subject.timetable.forEach(slot => {
        if (timetable[slot.day]) {
          timetable[slot.day].push({
            subject: {
              code: subject.code,
              name: subject.name,
              id: subject._id
            },
            time: `${slot.startTime} - ${slot.endTime}`,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room,
            faculty: subject.faculty
          });
        }
      });
    });

    // Sort by time
    Object.keys(timetable).forEach(day => {
      timetable[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json(timetable);
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/timetable/:subjectId
// @desc    Update subject timetable
// @access  Private (Admin, SuperAdmin)
router.put('/:subjectId', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { timetable } = req.body;

    const subject = await Subject.findById(req.params.subjectId);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (req.user.role === 'admin' && subject.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    subject.timetable = timetable;
    await subject.save();

    res.json(subject);
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

