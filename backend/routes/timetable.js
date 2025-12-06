const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');
const WeeklyTimetable = require('../models/WeeklyTimetable');
const Semester = require('../models/Semester');
const Student = require('../models/Student');
const TimetableGenerator = require('../services/timetableGenerator');

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

    // Students see only timetables for their own branch/section
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.json([]);
      }

      // Filter by student's branch and section
      query.branch = student.branch || student.department;
      if (student.section) {
        query.section = student.section;
      }
    }

    // Admins see only timetables for subjects they teach
    if (req.user.role === 'admin') {
      // Find subjects taught by this admin
      const subjects = await Subject.find({ 'faculty.teacher': req.user._id });
      if (subjects.length === 0) {
        return res.json([]);
      }

      // Get unique branches from these subjects
      const branchIds = [...new Set(subjects.map(s => s.branch.toString()))];
      query.branch = { $in: branchIds };
    }

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
    let timetableQuery = WeeklyTimetable.findById(req.params.id);

    // Admins can only access timetables for subjects they teach
    if (req.user.role === 'admin') {
      // Find subjects taught by this admin
      const subjects = await Subject.find({ 'faculty.teacher': req.user._id });
      if (subjects.length === 0) {
        return res.status(403).json({ message: 'Access denied. No subjects assigned.' });
      }

      // Get unique branches from these subjects
      const branchIds = [...new Set(subjects.map(s => s.branch.toString()))];

      timetableQuery = timetableQuery.where('branch').in(branchIds);
    }

    const timetable = await timetableQuery
      .populate('semester', 'name semesterNumber academicYear startDate endDate')
      .populate('schedule.slots.subject', 'code name credits')
      .populate('schedule.slots.faculty', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    // Additional check for admins
    if (req.user.role === 'admin') {
      const subjects = await Subject.find({ 'faculty.teacher': req.user._id });
      const branchIds = [...new Set(subjects.map(s => s.branch.toString()))];

      if (!branchIds.includes(timetable.branch.toString())) {
        return res.status(403).json({ message: 'Access denied. Not authorized for this timetable.' });
      }
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

    let timetableQuery = WeeklyTimetable.findOne({
      branch,
      section,
      isActive: true,
      effectiveFrom: { $lte: date },
      $or: [
        { effectiveTill: null },
        { effectiveTill: { $gte: date } }
      ]
    });

    // Admins can only access timetables for subjects they teach
    if (req.user.role === 'admin') {
      // Find subjects taught by this admin
      const subjects = await Subject.find({ 'faculty.teacher': req.user._id });
      if (subjects.length === 0) {
        return res.status(403).json({ message: 'Access denied. No subjects assigned.' });
      }

      // Get unique branches from these subjects
      const branchIds = [...new Set(subjects.map(s => s.branch.toString()))];

      if (!branchIds.includes(branch)) {
        return res.status(403).json({ message: 'Access denied. Not authorized for this branch.' });
      }
    }

    const timetable = await timetableQuery
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

// @route   POST /api/timetables/generate
// @desc    Generate a new weekly timetable with conflict resolution
// @access  Admin, SuperAdmin
router.post('/generate', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const {
      university,
      campus,
      school,
      program,
      course,
      branch,
      batch,
      semester,
      section,
      effectiveFrom,
      configuration,
      subjectWeeklyClasses // New parameter for subject weekly classes
    } = req.body;

    console.log('=== TIMETABLE GENERATION REQUEST ===');
    console.log('Request body:', {
      university,
      campus,
      school,
      program,
      course,
      branch,
      batch,
      semester,
      section,
      effectiveFrom,
      configuration,
      subjectWeeklyClasses
    });

    // Validation
    if (!university || !campus || !school || !program || !course || !branch || 
        !batch || !semester || !section || !effectiveFrom || !configuration) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        message: 'Please provide all required fields for timetable generation' 
      });
    }

    // Validate configuration structure
    const { 
      dailyHours, 
      offDay, 
      breaks = [], 
      teacherAvailability = [], 
      roomAvailability = [],
      rooms = []
    } = configuration;

    console.log('Configuration details:', {
      dailyHours,
      offDay,
      breaks,
      teacherAvailability,
      roomAvailability,
      rooms
    });

    if (!dailyHours || !dailyHours.startTime || !dailyHours.endTime) {
      console.log('Validation failed: Missing daily hours');
      return res.status(400).json({ 
        message: 'Please provide daily college hours (start and end time)' 
      });
    }

    // Validate that rooms are provided
    if (!rooms || rooms.length === 0) {
      console.log('Validation failed: No rooms provided');
      return res.status(400).json({ 
        message: 'Please provide at least one room for timetable generation' 
      });
    }

    // Use the advanced timetable generator
    const generator = new TimetableGenerator();
    
    // Initialize with configuration
    console.log('Initializing timetable generator...');
    await generator.initialize({
      branch,
      semester,
      dailyHours,
      breaks,
      teacherAvailability,
      roomAvailability,
      rooms,
      offDay,
      subjectWeeklyClasses: subjectWeeklyClasses || {} // Pass subjectWeeklyClasses from frontend
    });

    // Generate the timetable
    console.log('Generating timetable...');
    const result = await generator.generate();
    console.log('Generation result:', result);

    if (result.success) {
      console.log(`Successfully generated timetable with ${result.scheduledSessions} sessions`);
      // Transform the result to match the expected format
      const transformedSchedule = result.timetable.map(dayObj => ({
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayObj.day),
        dayName: dayObj.day,
        slots: dayObj.slots.flatMap(slot => 
          slot.assignments.map((assignment, index) => ({
            slotNumber: slot.slotNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: assignment.subjectId,
            subjectCode: assignment.subjectCode,
            subjectName: assignment.subjectName,
            faculty: assignment.teacherId,
            facultyName: assignment.teacherName,
            room: assignment.roomName,
            isBreak: false,
            breakType: 'none'
          }))
        )
      }));

      const generatedTimetable = {
        schedule: transformedSchedule,
        totalPeriods: result.scheduledSessions,
        workingDays: result.timetable.length,
        periodsPerDay: Math.ceil(result.scheduledSessions / result.timetable.length)
      };

      res.json({
        success: true,
        message: 'Timetable generated successfully',
        timetable: generatedTimetable
      });
    } else {
      console.log(`Timetable generation failed with ${result.unscheduledSessions.length} unscheduled sessions`);
      // Generate conflict report
      const conflictReport = generator.generateConflictReport(result.unscheduledSessions);
      
      res.status(400).json({ 
        success: false,
        message: conflictReport.message,
        issues: conflictReport.issues,
        suggestions: conflictReport.suggestions,
        unscheduledCount: result.unscheduledSessions.length
      });
    }
  } catch (error) {
    console.error('Timetable generation error:', error);
    res.status(500).json({ 
      message: 'Server error during timetable generation', 
      error: error.message 
    });
  }
});

// Helper function to generate weekly timetable (legacy)
async function generateWeeklyTimetableLegacy(params) {
  const {
    subjects,
    teachers,
    dailyHours,
    offDay,
    breaks,
    teacherAvailability,
    roomAvailability,
    section,
    subjectWeeklyClasses, // New parameter
    existingTimetables = [] // New parameter for global conflict checking
  } = params;

  // Process existing timetables to find busy slots for teachers and rooms
  const globalTeacherBusySlots = {}; // { teacherId: { dayName: [{start, end}] } }
  const globalRoomBusySlots = {};    // { roomName: { dayName: [{start, end}] } }

  existingTimetables.forEach(tt => {
    if (tt.schedule && Array.isArray(tt.schedule)) {
      tt.schedule.forEach(daySchedule => {
        const dayName = daySchedule.dayName;

        if (daySchedule.slots && Array.isArray(daySchedule.slots)) {
          daySchedule.slots.forEach(slot => {
            // Record teacher busy slots
            if (slot.faculty) {
              const teacherId = slot.faculty.toString();
              if (!globalTeacherBusySlots[teacherId]) {
                globalTeacherBusySlots[teacherId] = {};
              }
              if (!globalTeacherBusySlots[teacherId][dayName]) {
                globalTeacherBusySlots[teacherId][dayName] = [];
              }
              globalTeacherBusySlots[teacherId][dayName].push({
                startTime: slot.startTime,
                endTime: slot.endTime,
                branch: tt.branch,
                section: tt.section
              });
            }

            // Record room busy slots
            if (slot.room) {
              const roomName = slot.room;
              if (!globalRoomBusySlots[roomName]) {
                globalRoomBusySlots[roomName] = {};
              }
              if (!globalRoomBusySlots[roomName][dayName]) {
                globalRoomBusySlots[roomName][dayName] = [];
              }
              globalRoomBusySlots[roomName][dayName].push({
                startTime: slot.startTime,
                endTime: slot.endTime,
                branch: tt.branch,
                section: tt.section
              });
            }
          });
        }
      });
    }
  });

  // Days of the week (excluding off day)
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const workingDays = DAYS.filter(day => day !== offDay);

  // Create empty schedule structure
  const schedule = workingDays.map((dayName, dayIndex) => ({
    dayOfWeek: DAYS.indexOf(dayName),
    dayName,
    slots: []
  }));

  // Calculate time slots (assuming 1-hour periods)
  const startTime = dailyHours.startTime || '09:30';
  const endTime = dailyHours.endTime || '17:30';
  
  // Calculate time slots based on daily hours
  const timeSlots = [];
  let currentTime = startTime;
  
  while (currentTime < endTime) {
    const [hours, minutes] = currentTime.split(':').map(Number);
    const nextHours = hours + 1;
    const nextTime = `${nextHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    timeSlots.push({
      startTime: currentTime,
      endTime: nextTime
    });
    
    currentTime = nextTime;
  }

  // Create a list of all subject instances to be scheduled
  // Each subject should appear the number of times specified in subjectWeeklyClasses
  const subjectInstances = [];
  subjects.forEach(subject => {
    const requiredClasses = subjectWeeklyClasses && subjectWeeklyClasses[subject._id] 
      ? subjectWeeklyClasses[subject._id] 
      : 3; // Default to 3 classes per week
    
    // Add this subject the required number of times to the schedule list
    for (let i = 0; i < requiredClasses; i++) {
      subjectInstances.push({
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        faculty: subject.faculty,
        instanceId: `${subject._id}_${i}` // Unique identifier for each instance
      });
    }
  });

  // Shuffle the subject instances to distribute them randomly
  const shuffledInstances = subjectInstances.sort(() => Math.random() - 0.5);

  // Calculate total available slots
  const totalAvailableSlots = workingDays.length * timeSlots.length;
  const totalInstances = shuffledInstances.length;
  
  // If we have more classes than slots, we'll need to distribute them as evenly as possible
  const instancesToSchedule = totalInstances <= totalAvailableSlots ? 
    shuffledInstances : 
    shuffledInstances.slice(0, totalAvailableSlots);

  // Create a list of valid time slots for each day (excluding breaks)
  const validTimeSlotsPerDay = {};
  workingDays.forEach(dayName => {
    validTimeSlotsPerDay[dayName] = timeSlots.filter(slot => {
      // Check if this time slot is a break for this specific day
      return !breaks.some(breakItem => 
        breakItem.day === dayName && breakItem.startTime <= slot.startTime && breakItem.endTime > slot.startTime
      );
    });
  });

  // Function to check if a teacher is available at a specific time on a specific day
  const isTeacherAvailable = (teacherId, dayName, startTime, endTime) => {
    // Check global timetable conflicts
    if (globalTeacherBusySlots[teacherId] && globalTeacherBusySlots[teacherId][dayName]) {
      const conflicts = globalTeacherBusySlots[teacherId][dayName].some(busySlot => 
        startTime < busySlot.endTime && endTime > busySlot.startTime
      );
      if (conflicts) return false;
    }

    // If no availability is provided, default to college hours
    if (!teacherAvailability || teacherAvailability.length === 0) {
      return true; // Available during college hours by default
    }
    
    // Check if teacher has any availability entries for this day
    const dayAvailability = teacherAvailability.filter(entry => 
      entry.teacherId === teacherId && entry.day === dayName
    );
    
    // If no specific availability for this day, default to college hours
    if (dayAvailability.length === 0) {
      return true;
    }
    
    // Check if the time slot falls within any of the teacher's available periods
    return dayAvailability.some(entry => 
      startTime >= entry.startTime && endTime <= entry.endTime
    );
  };

  // Function to check if a room is available at a specific time on a specific day
  const isRoomAvailable = (roomName, dayName, startTime, endTime) => {
    // Check global timetable conflicts
    if (globalRoomBusySlots[roomName] && globalRoomBusySlots[roomName][dayName]) {
      const conflicts = globalRoomBusySlots[roomName][dayName].some(busySlot => 
        startTime < busySlot.endTime && endTime > busySlot.startTime
      );
      if (conflicts) return false;
    }

    // If no room availability is provided, assume all rooms are available during college hours
    if (!roomAvailability || roomAvailability.length === 0) {
      return true;
    }
    
    // Check if room has any unavailable periods for this day
    const unavailablePeriods = roomAvailability.filter(entry => 
      entry.room === roomName && entry.day === dayName
    );
    
    // If no unavailable periods for this room on this day, it's available
    if (unavailablePeriods.length === 0) {
      return true;
    }
    
    // Check if the time slot conflicts with any unavailable periods
    return !unavailablePeriods.some(entry => 
      (startTime < entry.endTime && endTime > entry.startTime)
    );
  };

  // Function to check if a time slot conflicts with existing scheduled classes
  const hasTimeConflict = (day, startTime, endTime, teacherId, roomName) => {
    return day.slots.some(slot => 
      (slot.startTime < endTime && slot.endTime > startTime) && 
      (slot.faculty === teacherId || slot.room === roomName)
    );
  };

  // Distribute subjects across all working days and time slots respecting availability
  let instanceIndex = 0;
  const totalInstancesToSchedule = shuffledInstances.length;
  let attempts = 0;
  const maxAttempts = totalInstancesToSchedule * 10; // Prevent infinite loops
  
  while (instanceIndex < totalInstancesToSchedule && attempts < maxAttempts) {
    attempts++;
    
    // Get the current subject instance to schedule
    const subject = shuffledInstances[instanceIndex];
    
    // Get faculty information
    let faculty = null;
    let facultyName = 'TBA';
    
    if (subject.faculty && subject.faculty.length > 0) {
      // Get the first faculty member
      const firstFaculty = subject.faculty[0];
      if (firstFaculty.teacher) {
        faculty = firstFaculty.teacher;
        facultyName = firstFaculty.teacher.name || 'TBA';
      }
    }
    
    let classScheduled = false;
    
    // Try to find a suitable time slot across all days
    for (let dayIndex = 0; dayIndex < workingDays.length && !classScheduled; dayIndex++) {
      const day = schedule[dayIndex];
      const dayName = day.dayName;
      const validSlots = validTimeSlotsPerDay[dayName];
      
      // Try each valid time slot for this day
      for (let slotIndex = 0; slotIndex < validSlots.length && !classScheduled; slotIndex++) {
        const slot = validSlots[slotIndex];
        
        // Generate a room name (rotating through available rooms)
        const roomName = `Room ${String.fromCharCode(65 + (instanceIndex % 5))}`;
        
        // Check all constraints:
        // 1. Teacher availability
        // 2. Room availability
        // 3. No time conflicts with already scheduled classes
        if (isTeacherAvailable(faculty ? faculty._id : null, dayName, slot.startTime, slot.endTime) &&
            isRoomAvailable(roomName, dayName, slot.startTime, slot.endTime) &&
            !hasTimeConflict(day, slot.startTime, slot.endTime, faculty ? faculty._id : null, roomName)) {
          
          // Schedule the class
          day.slots.push({
            slotNumber: day.slots.length + 1,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: subject._id,
            subjectCode: subject.code,
            subjectName: subject.name,
            faculty: faculty ? faculty._id : null,
            facultyName: facultyName,
            room: roomName,
            isBreak: false,
            breakType: 'none'
          });
          
          instanceIndex++;
          classScheduled = true;
          break;
        }
      }
    }
    
    // If we couldn't schedule this class, try the next one
    if (!classScheduled) {
      // Move this instance to the end of the queue to try again later
      if (instanceIndex < totalInstancesToSchedule - 1) {
        const instance = shuffledInstances.splice(instanceIndex, 1)[0];
        shuffledInstances.push(instance);
      } else {
        // If we're at the end, move to the next attempt
        instanceIndex++;
      }
    }
  }

  return {
    schedule,
    totalPeriods: instanceIndex, // Number of successfully scheduled classes
    workingDays: workingDays.length,
    periodsPerDay: Math.ceil(instanceIndex / workingDays.length)
  };
}

// @route   GET /api/timetables/teacher/:teacherId
// @desc    Get teacher's timetable (all classes they teach)
// @access  Private
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const authenticatedUserId = req.user.id.toString();

    console.log(`Teacher timetable request - Route param teacherId: ${teacherId}, Authenticated user ID: ${authenticatedUserId}`);
    console.log(`Full req.user object:`, req.user);

    // Teachers can only view their own timetable, superadmins can view any
    if (req.user.role === 'admin' && authenticatedUserId !== teacherId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own timetable.' });
    }

    // Find all active timetables where this teacher has classes
    const allTimetables = await WeeklyTimetable.find({ isActive: true })
      .populate('schedule.slots.subject', 'code name')
      .populate('schedule.slots.faculty', 'name email');

    console.log(`Finding timetable for teacher ${teacherId}`);
    console.log(`Found ${allTimetables.length} active timetables`);

    // Log timetable details for debugging
    allTimetables.forEach((tt, index) => {
      console.log(`Timetable ${index + 1}:`, {
        id: tt._id,
        branch: tt.branch,
        section: tt.section,
        semesterNumber: tt.semesterNumber
      });
      tt.schedule.forEach((daySchedule, dayIndex) => {
        if (daySchedule && daySchedule.slots && daySchedule.slots.length > 0) {
          console.log(`  Day ${dayIndex} (${daySchedule.dayName}): ${daySchedule.slots.length} slots`);
          daySchedule.slots.forEach((slot, slotIndex) => {
            console.log(`    Slot ${slotIndex}:`, {
              subject: slot.subject?.code || 'No subject',
              faculty: slot.faculty,
              startTime: slot.startTime,
              endTime: slot.endTime
            });
          });
        }
      });
    });

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
            // Ensure both IDs are compared as strings
            const isMatch = slotFacultyId === teacherId.toString();
            console.log(`Comparing slot faculty: ${slotFacultyId} with teacherId: ${teacherId}, Match: ${isMatch}`);
            return isMatch;
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

    console.log('=== SECTION TIMETABLE REQUEST ===');
    console.log('Branch:', branch);
    console.log('Section:', section);
    console.log('Semester:', semester);
    console.log('User ID:', req.user._id);
    console.log('User Role:', req.user.role);

    const timetable = await WeeklyTimetable.findOne({
      branch,
      section,
      semester,
      isActive: true
    })
      .populate('schedule.slots.subject', 'code name credits')
      .populate('schedule.slots.faculty', 'name email');

    console.log('Timetable found:', !!timetable);
    if (timetable) {
      console.log('Timetable ID:', timetable._id);
    }

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
