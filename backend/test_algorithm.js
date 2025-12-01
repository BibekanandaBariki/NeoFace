
// Mock Data
const subjects = [
    { _id: 'sub1', code: 'IS', name: 'Information Security', faculty: [{ teacher: { _id: 't1', name: 'Sunil Sir' } }] },
    { _id: 'sub2', code: 'DS', name: 'Data Structure', faculty: [{ teacher: { _id: 't2', name: 'Other Sir' } }] }
];

const subjectWeeklyClasses = {
    'sub1': 6,
    'sub2': 8
};

const dailyHours = { startTime: '09:30', endTime: '17:30' };
const offDay = 'Sunday';
const breaks = [
    { day: 'Monday', startTime: '11:00', endTime: '11:15' },
    { day: 'Monday', startTime: '13:00', endTime: '14:00' },
    { day: 'Tuesday', startTime: '13:00', endTime: '14:00' },
    { day: 'Wednesday', startTime: '13:00', endTime: '14:00' },
    { day: 'Thursday', startTime: '13:00', endTime: '14:00' },
    { day: 'Friday', startTime: '13:00', endTime: '14:00' },
    { day: 'Saturday', startTime: '13:00', endTime: '14:00' }
];

const teacherAvailability = [
    { teacherId: 't1', day: 'Monday', startTime: '10:30', endTime: '11:30' },
    { teacherId: 't1', day: 'Tuesday', startTime: '10:30', endTime: '11:30' },
    { teacherId: 't1', day: 'Wednesday', startTime: '10:30', endTime: '11:30' },
    { teacherId: 't1', day: 'Thursday', startTime: '10:30', endTime: '11:30' },
    { teacherId: 't1', day: 'Friday', startTime: '10:30', endTime: '11:30' },
    { teacherId: 't1', day: 'Saturday', startTime: '10:30', endTime: '11:30' }
];

const roomAvailability = [
    { room: 'Room A', day: 'Monday', startTime: '10:30', endTime: '17:30' } // Room A unavailable Mon 10:30-5:30
];

// Paste the generateWeeklyTimetable function here
async function generateWeeklyTimetable(params) {
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

        if (nextTime > endTime) break; // Don't exceed end time

        timeSlots.push({
            startTime: currentTime,
            endTime: nextTime
        });

        currentTime = nextTime;
    }

    // Create a list of all subject instances to be scheduled
    const subjectInstances = [];
    subjects.forEach(subject => {
        const requiredClasses = subjectWeeklyClasses && subjectWeeklyClasses[subject._id]
            ? parseInt(subjectWeeklyClasses[subject._id])
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

    // Shuffle instances for randomness, but keep same subjects somewhat together to distribute them later
    // Actually, better to sort by "most constrained" first, but random is okay for now.
    const shuffledInstances = subjectInstances.sort(() => Math.random() - 0.5);

    // Helper: Check if a time slot overlaps with any break
    const isBreakTime = (dayName, slotStart, slotEnd) => {
        if (!breaks || breaks.length === 0) return false;
        return breaks.some(b =>
            b.day === dayName &&
            (
                (slotStart >= b.startTime && slotStart < b.endTime) || // Slot starts during break
                (slotEnd > b.startTime && slotEnd <= b.endTime) ||     // Slot ends during break
                (slotStart <= b.startTime && slotEnd >= b.endTime)     // Slot encompasses break
            )
        );
    };

    // Helper: Check teacher availability (Local + Global)
    const isTeacherAvailable = (teacherId, dayName, startTime, endTime) => {
        if (!teacherId) return true; // No teacher assigned (e.g. self study), assume available

        // 1. Check specific availability constraints provided in config
        if (teacherAvailability && teacherAvailability.length > 0) {
            const dayAvailability = teacherAvailability.filter(entry =>
                entry.teacherId === teacherId && entry.day === dayName
            );

            // If constraints exist for this day, must match one
            if (dayAvailability.length > 0) {
                const isWithin = dayAvailability.some(entry =>
                    startTime >= entry.startTime && endTime <= entry.endTime
                );
                if (!isWithin) return false;
            }
        }

        // 2. Check Global Busy Slots (from other timetables)
        if (globalTeacherBusySlots[teacherId] && globalTeacherBusySlots[teacherId][dayName]) {
            const isBooked = globalTeacherBusySlots[teacherId][dayName].some(busySlot =>
                (startTime < busySlot.endTime && endTime > busySlot.startTime)
            );
            if (isBooked) return false;
        }

        return true;
    };

    // Helper: Check room availability (Local + Global)
    const isRoomAvailable = (roomName, dayName, startTime, endTime) => {
        // 1. Check specific unavailability constraints provided in config
        if (roomAvailability && roomAvailability.length > 0) {
            const unavailablePeriods = roomAvailability.filter(entry =>
                entry.room === roomName && entry.day === dayName
            );

            if (unavailablePeriods.length > 0) {
                const isUnavailable = unavailablePeriods.some(entry =>
                    (startTime < entry.endTime && endTime > entry.startTime)
                );
                if (isUnavailable) return false;
            }
        }

        // 2. Check Global Busy Slots
        if (globalRoomBusySlots[roomName] && globalRoomBusySlots[roomName][dayName]) {
            const isBooked = globalRoomBusySlots[roomName][dayName].some(busySlot =>
                (startTime < busySlot.endTime && endTime > busySlot.startTime)
            );
            if (isBooked) return false;
        }

        return true;
    };

    // Helper: Check if section is already busy (Local conflict)
    const isSectionBusy = (daySchedule, startTime, endTime) => {
        return daySchedule.slots.some(slot =>
            (startTime < slot.endTime && endTime > slot.startTime)
        );
    };

    // --- Allocation Logic (Round Robin) ---

    let successfulAllocations = 0;
    const totalToAllocate = shuffledInstances.length;

    // We will try to allocate one class at a time, cycling through days
    // to ensure even distribution.

    let currentDayIndex = 0;
    const maxGlobalAttempts = totalToAllocate * 20; // Safety break
    let globalAttempts = 0;

    // Queue of instances to schedule
    let queue = [...shuffledInstances];
    let unallocatable = [];

    while (queue.length > 0 && globalAttempts < maxGlobalAttempts) {
        const instance = queue.shift(); // Take first subject
        globalAttempts++;

        let allocated = false;

        // Try to find a slot starting from currentDayIndex
        // We try all days once for this subject
        for (let d = 0; d < workingDays.length; d++) {
            const dayIdx = (currentDayIndex + d) % workingDays.length;
            const daySchedule = schedule[dayIdx];
            const dayName = daySchedule.dayName;

            // Try all time slots for this day
            // Shuffle slots to avoid filling morning first always? 
            // Or just iterate. Let's iterate for predictability, but maybe offset?
            for (let s = 0; s < timeSlots.length; s++) {
                const slot = timeSlots[s];

                // 1. Check Break
                if (isBreakTime(dayName, slot.startTime, slot.endTime)) continue;

                // 2. Check Section Busy
                if (isSectionBusy(daySchedule, slot.startTime, slot.endTime)) continue;

                // 3. Check Faculty & Room
                let faculty = null;
                let facultyName = 'TBA';
                if (instance.faculty && instance.faculty.length > 0) {
                    // Simple logic: take first primary. 
                    // Improvement: check all available faculty?
                    const f = instance.faculty[0].teacher;
                    if (f) {
                        faculty = f;
                        facultyName = f.name;
                    }
                }

                // Generate Room (Round robin or random)
                // Ideally this should be smart, but let's stick to simple assignment for now
                // or use a pool of rooms.
                const roomName = `Room ${String.fromCharCode(65 + (successfulAllocations % 5))}`;

                if (isTeacherAvailable(faculty ? faculty._id : null, dayName, slot.startTime, slot.endTime) &&
                    isRoomAvailable(roomName, dayName, slot.startTime, slot.endTime)) {

                    // Allocate!
                    daySchedule.slots.push({
                        slotNumber: daySchedule.slots.length + 1,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        subject: instance._id,
                        subjectCode: instance.code,
                        subjectName: instance.name,
                        faculty: faculty ? faculty._id : null,
                        facultyName: facultyName,
                        room: roomName,
                        isBreak: false
                    });

                    // Sort slots by time
                    daySchedule.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

                    allocated = true;
                    successfulAllocations++;

                    // Move to next day for next allocation to spread load
                    currentDayIndex = (dayIdx + 1) % workingDays.length;
                    break; // Stop looking for slots for this instance
                }
            }

            if (allocated) break; // Stop looking for days for this instance
        }

        if (!allocated) {
            // If we couldn't place it, put it back at the end of queue?
            // Or mark as unallocatable if we've tried too many times?
            // For now, push back if we haven't exceeded max attempts significantly
            if (globalAttempts < maxGlobalAttempts) {
                queue.push(instance);
            } else {
                unallocatable.push(instance);
            }
        }
    }

    return {
        schedule,
        totalPeriods: successfulAllocations,
        workingDays: workingDays.length,
        unallocated: unallocatable.length
    };
}

// Run Test
generateWeeklyTimetable({
    subjects,
    teachers: [],
    dailyHours,
    offDay,
    breaks,
    teacherAvailability,
    roomAvailability,
    section: 'A',
    subjectWeeklyClasses
}).then(result => {
    console.log('=== GENERATION RESULT ===');
    console.log('Total Periods:', result.totalPeriods);
    console.log('Unallocated:', result.unallocated);
    console.log('Working Days:', result.workingDays);

    console.log('\n=== SCHEDULE ANALYSIS ===');
    result.schedule.forEach(day => {
        console.log(`\n${day.dayName} (${day.slots.length} slots):`);
        day.slots.forEach(slot => {
            console.log(`  ${slot.startTime}-${slot.endTime} | ${slot.subjectCode} | ${slot.facultyName} | ${slot.room}`);
        });
    });

    // Verify Constraints
    console.log('\n=== VERIFICATION ===');

    // 1. Check Breaks
    let breakViolation = false;
    result.schedule.forEach(day => {
        day.slots.forEach(slot => {
            if (breaks.some(b => b.day === day.dayName &&
                ((slot.startTime >= b.startTime && slot.startTime < b.endTime) ||
                    (slot.endTime > b.startTime && slot.endTime <= b.endTime)))) {
                console.error(`❌ Break Violation: ${day.dayName} ${slot.startTime}-${slot.endTime}`);
                breakViolation = true;
            }
        });
    });
    if (!breakViolation) console.log('✅ No break violations');

    // 2. Check Teacher Availability (Sunil Sir t1)
    let teacherViolation = false;
    result.schedule.forEach(day => {
        day.slots.forEach(slot => {
            if (slot.faculty === 't1') {
                // Sunil sir only available 10:30-11:30
                if (slot.startTime !== '10:30') {
                    console.error(`❌ Teacher Violation: Sunil Sir assigned at ${slot.startTime} on ${day.dayName}`);
                    teacherViolation = true;
                }
            }
        });
    });
    if (!teacherViolation) console.log('✅ Teacher availability respected');

    // 3. Check Distribution
    const slotsPerDay = result.schedule.map(d => d.slots.length);
    const maxSlots = Math.max(...slotsPerDay);
    const minSlots = Math.min(...slotsPerDay);
    console.log(`Distribution: Min ${minSlots}, Max ${maxSlots}`);
    if (maxSlots - minSlots <= 2) console.log('✅ Classes distributed evenly');
    else console.warn('⚠️ Uneven distribution');

});
