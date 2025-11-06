const express = require('express');
const router = express.Router();
const WeeklyTimetable = require('../models/WeeklyTimetable');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/timetables
// @desc    Get all weekly timetables
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { branch, section, semester, isActive } = req.query;
    
    const query = {};
    if (branch) query.branch = branch;
    if (section) query.section = section;
    if (semester) query.semester = semester;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const timetables = await WeeklyTimetable.find(query)
      .populate('semester', 'name semesterNumber academicYear')
      .populate('schedule.slots.subject', 'code name')
      .populate('schedule.slots.faculty', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(timetables);
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/timetables/:id
// @desc    Get timetable by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const timetable = await WeeklyTimetable.findById(req.params.id)
      .populate('semester', 'name semesterNumber academicYear startDate endDate')
      .populate('schedule.slots.subject', 'code name credits')
      .populate('schedule.slots.faculty', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    res.json(timetable);
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/timetables/for-date/:date
// @desc    Get timetable for a specific date
// @access  Private
router.get('/for-date/:date', auth, async (req, res) => {
  try {
    const { branch, section } = req.query;
    const date = new Date(req.params.date);
    
    if (!branch || !section) {
      return res.status(400).json({ message: 'Branch and section are required' });
    }
    
    // Find active timetable for this branch/section
    const timetable = await WeeklyTimetable.findOne({
      branch,
      section,
      isActive: true,
      effectiveFrom: { $lte: date },
      $or: [
        { effectiveTill: null },
        { effectiveTill: { $gte: date } }
      ]
    })
    .populate('schedule.slots.subject', 'code name credits')
    .populate('schedule.slots.faculty', 'name email');
    
    if (!timetable) {
      return res.status(404).json({ message: 'No active timetable found for this date' });
    }
    
    const daySchedule = timetable.getScheduleForDate(date);
    
    res.json({
      timetable: {
        _id: timetable._id,
        branch: timetable.branch,
        section: timetable.section
      },
      date,
      dayOfWeek: date.getDay(),
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
      schedule: daySchedule
    });
  } catch (error) {
    console.error('Get timetable for date error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/timetables
// @desc    Create new weekly timetable
// @access  Admin, SuperAdmin
router.post('/', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const {
      campus,
      program,
      branch,
      batch,
      section,
      semester,
      semesterNumber,
      academicYear,
      schedule,
      effectiveFrom,
      effectiveTill
    } = req.body;
    
    // Validation
    if (!campus || !program || !branch || !batch || !section || !semester || !semesterNumber || !academicYear || !schedule || !effectiveFrom) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Verify semester exists
    const semesterDoc = await Semester.findById(semester);
    if (!semesterDoc) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Deactivate existing active timetables for same branch/section
    await WeeklyTimetable.updateMany(
      { branch, section, semester, isActive: true },
      { $set: { isActive: false, effectiveTill: new Date() } }
    );
    
    // Validate and populate subject/faculty info
    const processedSchedule = await Promise.all(schedule.map(async (day) => {
      const processedSlots = await Promise.all(day.slots.map(async (slot) => {
        if (slot.subject && !slot.isBreak) {
          const subject = await Subject.findById(slot.subject);
          if (subject) {
            slot.subjectCode = subject.code;
            slot.subjectName = subject.name;
            // Get primary faculty for this section
            const primaryFaculty = subject.getPrimaryFaculty(section);
            if (primaryFaculty) {
              slot.faculty = primaryFaculty;
            }
          }
        }
        return slot;
      }));
      
      return {
        ...day,
        slots: processedSlots
      };
    }));
    
    const timetable = await WeeklyTimetable.create({
      campus,
      program,
      branch,
      batch,
      section,
      semester,
      semesterNumber,
      academicYear,
      schedule: processedSchedule,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTill: effectiveTill ? new Date(effectiveTill) : null,
      isActive: true,
      createdBy: req.user.id
    });
    
    const populated = await WeeklyTimetable.findById(timetable._id)
      .populate('semester', 'name semesterNumber academicYear')
      .populate('schedule.slots.subject', 'code name')
      .populate('schedule.slots.faculty', 'name email')
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      message: 'Timetable created successfully',
      timetable: populated
    });
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/timetables/:id
// @desc    Update weekly timetable
// @access  Admin, SuperAdmin
router.put('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const timetable = await WeeklyTimetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    const { schedule, effectiveFrom, effectiveTill, isActive } = req.body;
    
    // Process schedule if provided
    if (schedule) {
      const processedSchedule = await Promise.all(schedule.map(async (day) => {
        const processedSlots = await Promise.all(day.slots.map(async (slot) => {
          if (slot.subject && !slot.isBreak) {
            const subject = await Subject.findById(slot.subject);
            if (subject) {
              slot.subjectCode = subject.code;
              slot.subjectName = subject.name;
              // Get primary faculty for this section
              const primaryFaculty = subject.getPrimaryFaculty(timetable.section);
              if (primaryFaculty) {
                slot.faculty = primaryFaculty;
              }
            }
          }
          return slot;
        }));
        
        return {
          ...day,
          slots: processedSlots
        };
      }));
      
      timetable.schedule = processedSchedule;
    }
    
    if (effectiveFrom) timetable.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTill !== undefined) timetable.effectiveTill = effectiveTill ? new Date(effectiveTill) : null;
    if (isActive !== undefined) timetable.isActive = isActive;
    
    timetable.updatedBy = req.user.id;
    timetable.updatedAt = Date.now();
    
    await timetable.save();
    
    const updated = await WeeklyTimetable.findById(timetable._id)
      .populate('semester', 'name semesterNumber academicYear')
      .populate('schedule.slots.subject', 'code name')
      .populate('schedule.slots.faculty', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    res.json({
      message: 'Timetable updated successfully',
      timetable: updated
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/timetables/:id
// @desc    Delete timetable
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const timetable = await WeeklyTimetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    await WeeklyTimetable.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/timetables/add-slot
// @desc    Add a single slot to timetable with conflict detection
// @access  Admin, SuperAdmin
router.post('/add-slot', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const {
      branch,
      section,
      semester,
      dayOfWeek,
      dayName,
      slotNumber,
      startTime,
      endTime,
      subjectId,
      room
    } = req.body;

    // Validation
    if (!branch || !section || !semester || dayOfWeek === undefined || !startTime || !endTime || !subjectId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Get subject and faculty info
    const subject = await Subject.findById(subjectId).populate('faculty', 'name email');
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (!subject.faculty) {
      return res.status(400).json({ message: 'Subject must have an assigned teacher' });
    }

    const facultyId = subject.faculty._id;

    // Check 1: Time slot conflict for the same section
    const existingTimetable = await WeeklyTimetable.findOne({
      branch,
      section,
      semester,
      isActive: true
    });

    if (existingTimetable) {
      const daySchedule = existingTimetable.schedule.find(s => s.dayOfWeek === dayOfWeek);
      if (daySchedule) {
        const conflictingSlot = daySchedule.slots.find(slot => 
          (slot.startTime === startTime && slot.endTime === endTime) ||
          (slot.startTime < endTime && slot.endTime > startTime)
        );
        
        if (conflictingSlot) {
          return res.status(409).json({
            message: `Time slot conflict! This section already has ${conflictingSlot.subjectCode || 'a class'} scheduled at ${conflictingSlot.startTime}-${conflictingSlot.endTime} on ${dayName}`,
            conflict: {
              type: 'section_conflict',
              existingSlot: conflictingSlot
            }
          });
        }
      }
    }

    // Check 2: Teacher conflict - check if teacher has another class at same time
    const allTimetables = await WeeklyTimetable.find({ isActive: true });
    
    for (const tt of allTimetables) {
      // Skip same section
      if (tt.branch === branch && tt.section === section) continue;
      
      const daySchedule = tt.schedule.find(s => s.dayOfWeek === dayOfWeek);
      if (daySchedule) {
        const teacherConflict = daySchedule.slots.find(slot => 
          slot.faculty && slot.faculty.toString() === facultyId.toString() &&
          ((slot.startTime === startTime && slot.endTime === endTime) ||
           (slot.startTime < endTime && slot.endTime > startTime))
        );
        
        if (teacherConflict) {
          return res.status(409).json({
            message: `Teacher conflict! ${subject.faculty.name} is already scheduled to teach ${teacherConflict.subjectCode || 'another class'} in ${tt.branch} ${tt.section} at ${teacherConflict.startTime}-${teacherConflict.endTime} on ${dayName}`,
            conflict: {
              type: 'teacher_conflict',
              teacher: subject.faculty.name,
              conflictingClass: {
                branch: tt.branch,
                section: tt.section,
                subject: teacherConflict.subjectCode,
                time: `${teacherConflict.startTime}-${teacherConflict.endTime}`
              }
            }
          });
        }
      }
    }

    // No conflicts - add the slot
    let timetable = existingTimetable;
    
    if (!timetable) {
      // Create new timetable
      const semesterDoc = await Semester.findById(semester);
      timetable = await WeeklyTimetable.create({
        branch,
        section,
        semester,
        semesterNumber: semesterDoc.semesterNumber,
        academicYear: semesterDoc.academicYear,
        schedule: Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
          slots: []
        })),
        effectiveFrom: new Date(),
        isActive: true,
        createdBy: req.user.id
      });
    }

    // Add slot to the day
    let daySchedule = timetable.schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!daySchedule) {
      daySchedule = {
        dayOfWeek,
        dayName,
        slots: []
      };
      timetable.schedule.push(daySchedule);
    }

    daySchedule.slots.push({
      slotNumber,
      startTime,
      endTime,
      subject: subjectId,
      subjectCode: subject.code,
      subjectName: subject.name,
      faculty: facultyId,
      facultyName: subject.faculty.name,
      room: room || '',
      isBreak: false
    });

    // Sort slots by start time
    daySchedule.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    timetable.updatedBy = req.user.id;
    timetable.updatedAt = Date.now();
    await timetable.save();

    const populated = await WeeklyTimetable.findById(timetable._id)
      .populate('schedule.slots.subject', 'code name')
      .populate('schedule.slots.faculty', 'name email');

    res.status(201).json({
      message: 'Time slot added successfully',
      timetable: populated
    });
  } catch (error) {
    console.error('Add slot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/timetables/teacher/:teacherId
// @desc    Get teacher's timetable (all classes they teach)
// @access  Private
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    // Teachers can only view their own timetable, superadmins can view any
    if (req.user.role === 'admin' && req.user.id !== teacherId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own timetable.' });
    }

    // Find all active timetables where this teacher has classes
    const allTimetables = await WeeklyTimetable.find({ isActive: true })
      .populate('schedule.slots.subject', 'code name')
      .populate('schedule.slots.faculty', 'name email');

    console.log(`Finding timetable for teacher ${teacherId}`);
    console.log(`Found ${allTimetables.length} active timetables`);
    
    // Filter and organize teacher's classes
    const teacherSchedule = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    days.forEach((day, index) => {
      teacherSchedule[day] = [];

      allTimetables.forEach(tt => {
        const daySchedule = tt.schedule.find(s => s.dayOfWeek === index);
        if (daySchedule) {
          const teacherSlots = daySchedule.slots.filter(slot => {
            if (!slot.faculty) return false;
            // Handle both populated and unpopulated faculty
            const slotFacultyId = slot.faculty._id ? slot.faculty._id.toString() : slot.faculty.toString();
            return slotFacultyId === teacherId;
          });

          teacherSlots.forEach(slot => {
            teacherSchedule[day].push({
              time: `${slot.startTime} - ${slot.endTime}`,
              startTime: slot.startTime,
              endTime: slot.endTime,
              subject: slot.subject,
              branch: tt.branch,
              section: tt.section,
              semesterNumber: tt.semesterNumber,
              room: slot.room,
              slotNumber: slot.slotNumber
            });
          });
        }
      });

      // Sort by start time
      teacherSchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json({
      teacherId,
      teacherName: req.user.name,
      schedule: teacherSchedule
    });
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/timetables/section/:branch/:section/:semester
// @desc    Get section's timetable
// @access  Private
router.get('/section/:branch/:section/:semester', auth, async (req, res) => {
  try {
    const { branch, section, semester } = req.params;

    console.log('Section timetable request:', { branch, section, semester });

    const timetable = await WeeklyTimetable.findOne({
      branch,
      section,
      semester,
      isActive: true
    })
    .populate('schedule.slots.subject', 'code name credits')
    .populate('schedule.slots.faculty', 'name email');

    console.log('Found timetable:', timetable ? 'YES' : 'NO');
    
    if (!timetable) {
      // Also check if there's a timetable without section match (for debugging)
      const allTimetables = await WeeklyTimetable.find({ isActive: true }).select('branch section semester');
      console.log('All active timetables:', allTimetables);
      
      return res.status(404).json({ 
        message: 'No active timetable found for this section',
        emptySchedule: true,
        searched: { branch, section, semester },
        available: allTimetables
      });
    }

    res.json(timetable);
  } catch (error) {
    console.error('Get section timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
