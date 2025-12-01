// Inline test with the actual function code

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
        subjectWeeklyClasses,
        existingTimetables = []
    } = params;

    const globalTeacherBusySlots = {};
    const globalRoomBusySlots = {};

    existingTimetables.forEach(tt => {
        if (tt.schedule && Array.isArray(tt.schedule)) {
            tt.schedule.forEach(daySchedule => {
                const dayName = daySchedule.dayName;

                if (daySchedule.slots && Array.isArray(daySchedule.slots)) {
                    daySchedule.slots.forEach(slot => {
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
                                endTime: slot.endTime
                            });
                        }

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
                                endTime: slot.endTime
                            });
                        }
                    });
                }
            });
        }
    });

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const workingDays = DAYS.filter(day => day !== offDay);

    const schedule = workingDays.map((dayName, dayIndex) => ({
        dayOfWeek: DAYS.indexOf(dayName),
        dayName,
        slots: []
    }));

    const startTime = dailyHours.startTime || '09:30';
    const endTime = dailyHours.endTime || '17:30';

    const timeSlots = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
        const [hours, minutes] = currentTime.split(':').map(Number);
        const nextHours = hours + 1;
        const nextTime = `${nextHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        if (nextTime > endTime) break;

        timeSlots.push({
            startTime: currentTime,
            endTime: nextTime
        });

        currentTime = nextTime;
    }

    const subjectInstances = [];
    subjects.forEach(subject => {
        const requiredClasses = subjectWeeklyClasses && subjectWeeklyClasses[subject._id]
            ? parseInt(subjectWeeklyClasses[subject._id])
            : 3;

        for (let i = 0; i < requiredClasses; i++) {
            subjectInstances.push({
                _id: subject._id,
                code: subject.code,
                name: subject.name,
                faculty: subject.faculty,
                instanceId: `${subject._id}_${i}`
            });
        }
    });

    const shuffledInstances = subjectInstances.sort(() => Math.random() - 0.5);

    const isBreakTime = (dayName, slotStart, slotEnd) => {
        if (!breaks || breaks.length === 0) return false;
        return breaks.some(b =>
            b.day === dayName &&
            (
                (slotStart >= b.startTime && slotStart < b.endTime) ||
                (slotEnd > b.startTime && slotEnd <= b.endTime) ||
                (slotStart <= b.startTime && slotEnd >= b.endTime)
            )
        );
    };

    const isTeacherAvailable = (teacherId, dayName, startTime, endTime) => {
        if (!teacherId) return true;

        if (teacherAvailability && teacherAvailability.length > 0) {
            // Check if THIS teacher has ANY availability constraints
            const teacherConstraints = teacherAvailability.filter(entry =>
                entry.teacherId === teacherId
            );

            // If this teacher has availability constraints, they can ONLY be scheduled during those windows
            if (teacherConstraints.length > 0) {
                // Check if there's a constraint for this specific day
                const dayAvailability = teacherConstraints.filter(entry => entry.day === dayName);

                // If no constraint for this day, teacher is NOT available on this day at all
                if (dayAvailability.length === 0) {
                    return false;
                }

                // If there are constraints for this day, check if the time slot fits within any of them
                const isWithin = dayAvailability.some(entry =>
                    startTime >= entry.startTime && endTime <= entry.endTime
                );
                if (!isWithin) return false;
            }
        }

        if (globalTeacherBusySlots[teacherId] && globalTeacherBusySlots[teacherId][dayName]) {
            const isBooked = globalTeacherBusySlots[teacherId][dayName].some(busySlot =>
                (startTime < busySlot.endTime && endTime > busySlot.startTime)
            );
            if (isBooked) return false;
        }

        return true;
    };

    const isRoomAvailable = (roomName, dayName, startTime, endTime) => {
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

        if (globalRoomBusySlots[roomName] && globalRoomBusySlots[roomName][dayName]) {
            const isBooked = globalRoomBusySlots[roomName][dayName].some(busySlot =>
                (startTime < busySlot.endTime && endTime > busySlot.startTime)
            );
            if (isBooked) return false;
        }

        return true;
    };

    const isSectionBusy = (daySchedule, startTime, endTime) => {
        return daySchedule.slots.some(slot =>
            (startTime < slot.endTime && endTime > slot.startTime)
        );
    };

    let successfulAllocations = 0;
    const totalToAllocate = shuffledInstances.length;

    let currentDayIndex = 0;
    const maxGlobalAttempts = totalToAllocate * 20;
    let globalAttempts = 0;

    let queue = [...shuffledInstances];
    let unallocatable = [];

    while (queue.length > 0 && globalAttempts < maxGlobalAttempts) {
        const instance = queue.shift();
        globalAttempts++;

        let allocated = false;

        for (let d = 0; d < workingDays.length; d++) {
            const dayIdx = (currentDayIndex + d) % workingDays.length;
            const daySchedule = schedule[dayIdx];
            const dayName = daySchedule.dayName;

            for (let s = 0; s < timeSlots.length; s++) {
                const slot = timeSlots[s];

                if (isBreakTime(dayName, slot.startTime, slot.endTime)) continue;
                if (isSectionBusy(daySchedule, slot.startTime, slot.endTime)) continue;

                let faculty = null;
                let facultyName = 'TBA';
                if (instance.faculty && instance.faculty.length > 0) {
                    const f = instance.faculty[0].teacher;
                    if (f) {
                        faculty = f;
                        facultyName = f.name;
                    }
                }

                const roomName = `Room ${String.fromCharCode(65 + (successfulAllocations % 5))}`;

                if (isTeacherAvailable(faculty ? faculty._id : null, dayName, slot.startTime, slot.endTime) &&
                    isRoomAvailable(roomName, dayName, slot.startTime, slot.endTime)) {

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

                    daySchedule.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

                    allocated = true;
                    successfulAllocations++;

                    currentDayIndex = (dayIdx + 1) % workingDays.length;
                    break;
                }
            }

            if (allocated) break;
        }

        if (!allocated) {
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

// Test Data
const subjects = [
    {
        _id: 'sub1',
        code: 'MATH',
        name: 'Mathematics',
        faculty: [{ teacher: { _id: 'teacher_strict', name: 'Dr. Strict' } }]
    },
    {
        _id: 'sub2',
        code: 'PHY',
        name: 'Physics',
        faculty: [{ teacher: { _id: 'teacher_flexible', name: 'Dr. Flexible' } }]
    }
];

const subjectWeeklyClasses = {
    'sub1': 3,
    'sub2': 4
};

const dailyHours = { startTime: '09:30', endTime: '17:30' };
const offDay = 'Sunday';

const breaks = [
    { day: 'Monday', startTime: '13:00', endTime: '14:00' },
    { day: 'Tuesday', startTime: '13:00', endTime: '14:00' },
    { day: 'Wednesday', startTime: '13:00', endTime: '14:00' },
    { day: 'Thursday', startTime: '13:00', endTime: '14:00' },
    { day: 'Friday', startTime: '13:00', endTime: '14:00' },
    { day: 'Saturday', startTime: '13:00', endTime: '14:00' }
];

// CRITICAL: Dr. Strict ONLY available Monday 16:30-17:30 (4:30-5:30 PM)
const teacherAvailability = [
    { teacherId: 'teacher_strict', day: 'Monday', startTime: '16:30', endTime: '17:30' }
];

// Room A unavailable Monday 10:00-16:00
const roomAvailability = [
    { room: 'Room A', day: 'Monday', startTime: '10:00', endTime: '16:00' }
];

// Run Test
(async () => {
    try {
        console.log('=== TESTING STRICT TEACHER AVAILABILITY ===');
        console.log('Dr. Strict (MATH): ONLY Monday 16:30-17:30 (4:30-5:30 PM)');
        console.log('Room A: Unavailable Monday 10:00-16:00');
        console.log('');

        const result = await generateWeeklyTimetable({
            subjects,
            teachers: [],
            dailyHours,
            offDay,
            breaks,
            teacherAvailability,
            roomAvailability,
            section: 'A',
            subjectWeeklyClasses
        });

        console.log('=== GENERATION RESULT ===');
        console.log('Total Periods Scheduled:', result.totalPeriods);
        console.log('Unallocated:', result.unallocated);
        console.log('');

        console.log('=== DETAILED SCHEDULE ===');
        result.schedule.forEach(day => {
            console.log(`\n${day.dayName} (${day.slots.length} slots):`);
            day.slots.forEach(slot => {
                console.log(`  ${slot.startTime}-${slot.endTime} | ${slot.subjectCode.padEnd(5)} | ${slot.facultyName.padEnd(20)} | ${slot.room}`);
            });
        });

        // VERIFICATION
        console.log('\n=== CRITICAL VERIFICATION ===');

        let violations = 0;

        // 1. Check Dr. Strict's schedule
        console.log('\n1. Dr. Strict Availability (ONLY Mon 16:30-17:30):');
        let strictCount = 0;
        result.schedule.forEach(day => {
            day.slots.forEach(slot => {
                if (slot.faculty === 'teacher_strict') {
                    strictCount++;
                    const isValid = day.dayName === 'Monday' &&
                        slot.startTime === '16:30' &&
                        slot.endTime === '17:30';

                    if (!isValid) {
                        console.error(`   ❌ VIOLATION: Dr. Strict at ${day.dayName} ${slot.startTime}-${slot.endTime}`);
                        violations++;
                    } else {
                        console.log(`   ✅ VALID: Dr. Strict at ${day.dayName} ${slot.startTime}-${slot.endTime}`);
                    }
                }
            });
        });
        console.log(`   Total Dr. Strict classes: ${strictCount} (Expected: max 1 per week due to constraint)`);

        // 2. Check Room A on Monday
        console.log('\n2. Room A Availability (Unavailable Mon 10:00-16:00):');
        const mondaySchedule = result.schedule.find(d => d.dayName === 'Monday');
        if (mondaySchedule) {
            mondaySchedule.slots.forEach(slot => {
                if (slot.room === 'Room A') {
                    const isInUnavailableWindow = slot.startTime >= '10:00' && slot.startTime < '16:00';

                    if (isInUnavailableWindow) {
                        console.error(`   ❌ VIOLATION: Room A used Monday ${slot.startTime}-${slot.endTime}`);
                        violations++;
                    } else {
                        console.log(`   ✅ VALID: Room A used Monday ${slot.startTime}-${slot.endTime}`);
                    }
                }
            });
        }

        // 3. Check Breaks
        console.log('\n3. Break Violations:');
        let breakViolations = 0;
        result.schedule.forEach(day => {
            day.slots.forEach(slot => {
                const breakConflict = breaks.find(b =>
                    b.day === day.dayName &&
                    ((slot.startTime >= b.startTime && slot.startTime < b.endTime) ||
                        (slot.endTime > b.startTime && slot.endTime <= b.endTime))
                );
                if (breakConflict) {
                    console.error(`   ❌ ${day.dayName} ${slot.startTime}-${slot.endTime}`);
                    breakViolations++;
                }
            });
        });
        if (breakViolations === 0) {
            console.log('   ✅ No break violations');
        }
        violations += breakViolations;

        console.log('\n=== FINAL RESULT ===');
        if (violations === 0) {
            console.log('✅✅✅ ALL TESTS PASSED!');
        } else {
            console.error(`❌❌❌ FAILED - ${violations} violation(s) found!`);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
})();
