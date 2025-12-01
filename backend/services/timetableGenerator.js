const Subject = require('../models/Subject');
const WeeklyTimetable = require('../models/WeeklyTimetable');

/**
 * Advanced Timetable Generator using Constraint Satisfaction
 */
class TimetableGenerator {
  constructor() {
    this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    this.timeSlots = [];
    this.rooms = [];
    this.teacherAvailability = [];
    this.roomAvailability = [];
    this.subjects = [];
    this.studentGroups = [];
    this.scheduledAssignments = []; // Track all scheduled assignments to check conflicts
  }

  /**
   * Initialize the generator with user inputs and system data
   */
  async initialize(config) {
    const {
      dailyHours,
      breaks,
      teacherAvailability,
      roomAvailability,
      rooms,
      days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    } = config;

    // Set working days
    this.days = days;

    // Generate time slots based on daily hours and breaks
    this.generateTimeSlots(dailyHours, breaks);

    // Set availability constraints
    this.teacherAvailability = teacherAvailability || [];
    this.roomAvailability = roomAvailability || [];
    this.rooms = rooms || [];

    // Load subjects from database
    await this.loadSubjects(config.branch, config.semester);
  }

  /**
   * Generate time slots based on college hours and breaks
   */
  generateTimeSlots(dailyHours, breaks) {
    const { startTime, endTime } = dailyHours;
    this.timeSlots = [];
    
    let currentTime = startTime;
    let slotCounter = 1;
    
    while (currentTime < endTime) {
      const [hours, minutes] = currentTime.split(':').map(Number);
      const nextHours = hours + 1;
      const nextTime = `${nextHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Check if this time slot is a break (for any day)
      const isBreakSlot = breaks.some(breakItem => 
        breakItem.startTime <= currentTime && breakItem.endTime > currentTime
      );
      
      if (!isBreakSlot) {
        this.timeSlots.push({
          startTime: currentTime,
          endTime: nextTime,
          slotNumber: slotCounter++
        });
      }
      
      currentTime = nextTime;
    }
  }

  /**
   * Load subjects for the given branch and semester
   */
  async loadSubjects(branch, semester) {
    this.subjects = await Subject.find({ 
      branch, 
      semester: parseInt(semester) 
    }).populate('faculty.teacher', 'name email');
    
    // Add weeklySessions field based on credits if not present
    this.subjects = this.subjects.map(subject => {
      return {
        ...subject.toObject(),
        weeklySessions: subject.weeklySessions || subject.credits || 3
      };
    });
  }

  /**
   * Check if a teacher is available at a specific time slot
   */
  isTeacherAvailable(teacherId, day, startTime, endTime) {
    // If no availability constraints, teacher is available during college hours
    if (!this.teacherAvailability || this.teacherAvailability.length === 0) {
      return true;
    }

    // Find all availability entries for this specific teacher
    const teacherEntries = this.teacherAvailability.filter(entry => 
      entry.teacherId === teacherId
    );

    // If this teacher has no specific availability entries, they're available during college hours
    if (teacherEntries.length === 0) {
      return true;
    }

    // Find availability entries for this teacher on this specific day
    const dayEntries = teacherEntries.filter(entry => entry.day === day);

    // If no availability specified for this day, teacher is NOT available
    if (dayEntries.length === 0) {
      console.log(`Teacher ${teacherId} is not available on ${day} (no availability specified for this day)`);
      return false;
    }

    // Check if the time slot falls within any of the teacher's available periods
    const isAvailable = dayEntries.some(entry => 
      startTime >= entry.startTime && endTime <= entry.endTime
    );
  
    if (!isAvailable) {
      console.log(`Teacher ${teacherId} is not available on ${day} from ${startTime} to ${endTime}. Available periods:`, dayEntries);
    }
  
    return isAvailable;
  }

  /**
   * Check if a room is available at a specific time slot
   */
  isRoomAvailable(roomId, day, startTime, endTime) {
    // If no room availability constraints, room is available during college hours
    if (!this.roomAvailability || this.roomAvailability.length === 0) {
      return true;
    }

    // Check if this room has specified any availability constraints
    const roomHasSpecifiedConstraints = this.roomAvailability.some(entry => 
      entry.roomId === roomId
    );

    // If room hasn't specified any constraints, it's available during college hours
    if (!roomHasSpecifiedConstraints) {
      return true;
    }

    // Find all availability entries for this room on this specific day
    const availablePeriods = this.roomAvailability.filter(entry => 
      entry.roomId === roomId && entry.day === day
    );

    // If no specific availability for this day, room is available during college hours
    if (availablePeriods.length === 0) {
      return true;
    }

    // Check if the time slot falls within any of the room's available periods
    return availablePeriods.some(entry => 
      startTime >= entry.startTime && endTime <= entry.endTime
    );
  }

  /**
   * Check if there's a conflict with existing assignments
   */
  hasConflict(day, timeSlot, teacherId, roomId) {
    return this.scheduledAssignments.some(assignment => 
      assignment.day === day && 
      assignment.slot.startTime < timeSlot.endTime && 
      assignment.slot.endTime > timeSlot.startTime && 
      (assignment.teacherId === teacherId || assignment.roomId === roomId)
    );
  }

  /**
   * Generate the timetable using a more intelligent approach
   */
  async generate() {
    console.log('Starting timetable generation');
    console.log('Days:', this.days);
    console.log('Time slots:', this.timeSlots);
    console.log('Rooms:', this.rooms);
    console.log('Teacher availability:', this.teacherAvailability);
    console.log('Subjects:', this.subjects.map(s => ({code: s.code, name: s.name, faculty: s.faculty.map(f => f.teacher ? f.teacher.name : 'Unknown')})));

    // Create timetable structure
    const timetable = this.days.map(day => ({
      day,
      slots: this.timeSlots.map((slot, slotIndex) => ({
        ...slot,
        slotNumber: slotIndex + 1,
        assignments: [] // Will hold subject assignments
      }))
    }));

    // Create subject sessions (each subject needs multiple sessions per week)
    const subjectSessions = [];
    this.subjects.forEach(subject => {
      const requiredSessions = subject.weeklySessions || subject.credits || 3; // Default to 3 sessions
      for (let i = 0; i < requiredSessions; i++) {
        subjectSessions.push({
          subjectId: subject._id,
          subjectCode: subject.code,
          subjectName: subject.name,
          faculty: subject.faculty,
          credits: subject.credits,
          sessionId: i
        });
      }
    });

    console.log('Total sessions to schedule:', subjectSessions.length);

    // Try to schedule each session using a more systematic approach
    const unscheduledSessions = [];
    const scheduledSessions = [];

    // Schedule sessions one by one
    for (const session of subjectSessions) {
      let scheduled = false;
      console.log(`Trying to schedule session ${session.subjectCode} (${session.sessionId})`);
      
      // Try each day in a systematic way
      for (const dayObj of timetable) {
        // Try each time slot
        for (const slot of dayObj.slots) {
          // Try each room
          for (const room of this.rooms) {
            // Get teacher information
            let teacher = null;
            if (session.faculty && session.faculty.length > 0) {
              const firstFaculty = session.faculty[0];
              if (firstFaculty.teacher) {
                teacher = firstFaculty.teacher;
              }
            }

            // Check all constraints
            if (this.canScheduleSession(session, dayObj.day, slot, room, teacher)) {
              // Create assignment
              const assignment = {
                subjectId: session.subjectId,
                subjectCode: session.subjectCode,
                subjectName: session.subjectName,
                teacherId: teacher ? teacher._id : null,
                teacherName: teacher ? teacher.name : 'TBA',
                roomId: room.id,
                roomName: room.name,
                day: dayObj.day,
                slot: slot
              };

              // Schedule the session
              slot.assignments.push(assignment);
              this.scheduledAssignments.push(assignment);

              scheduledSessions.push(session);
              scheduled = true;
              console.log(`Successfully scheduled ${session.subjectCode} on ${dayObj.day} ${slot.startTime}-${slot.endTime} in ${room.name}`);
              break;
            }
          }
        
          if (scheduled) break;
        }
      
        if (scheduled) break;
      }

      if (!scheduled) {
        console.log(`Failed to schedule session ${session.subjectCode} (${session.sessionId})`);
        unscheduledSessions.push(session);
      }
    }

    console.log(`Generation complete. Scheduled: ${scheduledSessions.length}, Unscheduled: ${unscheduledSessions.length}`);

    return {
      timetable,
      scheduledSessions: scheduledSessions.length,
      totalSessions: subjectSessions.length,
      unscheduledSessions,
      success: unscheduledSessions.length === 0
    };
  }

  /**
   * Check if a session can be scheduled given all constraints
   */
  canScheduleSession(session, day, slot, room, teacher) {
    // Check teacher availability (only if teacher exists)
    if (teacher) {
      const teacherAvailable = this.isTeacherAvailable(teacher._id, day, slot.startTime, slot.endTime);
      if (!teacherAvailable) {
        console.log(`Cannot schedule session ${session.subjectCode} - Teacher ${teacher.name} not available on ${day} ${slot.startTime}-${slot.endTime}`);
        return false;
      }
    }

    // Check room availability
    const roomAvailable = this.isRoomAvailable(room.id, day, slot.startTime, slot.endTime);
    if (!roomAvailable) {
      console.log(`Cannot schedule session ${session.subjectCode} - Room ${room.name} not available on ${day} ${slot.startTime}-${slot.endTime}`);
      return false;
    }

    // Check for conflicts with existing assignments
    const hasConflict = this.hasConflict(day, slot, teacher ? teacher._id : null, room.id);
    if (hasConflict) {
      console.log(`Cannot schedule session ${session.subjectCode} - Conflict with existing assignment on ${day} ${slot.startTime}-${slot.endTime}`);
      return false;
    }

    return true;
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Generate a report of conflicts if timetable cannot be generated
   */
  generateConflictReport(unscheduledSessions) {
    const report = {
      message: 'Unable to generate timetable due to conflicting constraints',
      issues: [],
      suggestions: []
    };

    // Analyze unscheduled sessions to identify patterns
    const teacherLoad = {};
    const roomUsage = {};
    const timeSlotConflicts = {};

    unscheduledSessions.forEach(session => {
      // Count sessions per teacher
      if (session.faculty && session.faculty.length > 0) {
        const teacher = session.faculty[0].teacher;
        if (teacher) {
          if (!teacherLoad[teacher._id]) {
            teacherLoad[teacher._id] = { name: teacher.name, unavailableSlots: 0, conflicts: 0 };
          }
          teacherLoad[teacher._id].conflicts++;
        }
      }
    });

    // Check teacher availability issues
    Object.values(teacherLoad).forEach(teacher => {
      if (teacher.conflicts > 3) {
        report.issues.push(`Teacher ${teacher.name} has too many scheduling conflicts (${teacher.conflicts} sessions could not be scheduled)`);
      }
    });

    if (report.issues.length === 0) {
      report.issues.push(`Failed to schedule ${unscheduledSessions.length} sessions due to availability constraints`);
    }
    
    // Add suggestions based on analysis
    report.suggestions.push('Consider adjusting teacher availability constraints to provide more flexible scheduling options');
    report.suggestions.push('Consider adding more rooms or adjusting room availability');
    report.suggestions.push('Review the number of required sessions per subject - some subjects may have too many weekly sessions');
    report.suggestions.push('Check for overlapping unavailable periods that may be too restrictive');

    return report;
  }
}

module.exports = TimetableGenerator;