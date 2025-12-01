// Test: Teacher available ONLY Monday 4:30-5:30 PM
// This tests the strictest constraint scenario

// Mock Data
const subjects = [
    {
        _id: 'sub1',
        code: 'MATH',
        name: 'Mathematics',
        faculty: [{ teacher: { _id: 'teacher_strict', name: 'Dr. Strict Availability' } }]
    },
    {
        _id: 'sub2',
        code: 'PHY',
        name: 'Physics',
        faculty: [{ teacher: { _id: 'teacher_flexible', name: 'Dr. Flexible' } }]
    }
];

const subjectWeeklyClasses = {
    'sub1': 3,  // Math needs 3 classes
    'sub2': 4   // Physics needs 4 classes
};

const dailyHours = { startTime: '09:30', endTime: '17:30' };
const offDay = 'Sunday';

// Breaks
const breaks = [
    { day: 'Monday', startTime: '13:00', endTime: '14:00' },
    { day: 'Tuesday', startTime: '13:00', endTime: '14:00' },
    { day: 'Wednesday', startTime: '13:00', endTime: '14:00' },
    { day: 'Thursday', startTime: '13:00', endTime: '14:00' },
    { day: 'Friday', startTime: '13:00', endTime: '14:00' },
    { day: 'Saturday', startTime: '13:00', endTime: '14:00' }
];

// CRITICAL: Teacher availability - Dr. Strict ONLY available Monday 4:30-5:30 PM
const teacherAvailability = [
    { teacherId: 'teacher_strict', day: 'Monday', startTime: '16:30', endTime: '17:30' }
    // Dr. Flexible has no constraints, so defaults to college hours
];

// Room availability - Room A unavailable Monday 10:00-16:00
const roomAvailability = [
    { room: 'Room A', day: 'Monday', startTime: '10:00', endTime: '16:00' }
];

// Import the function from timetable.js
const generateWeeklyTimetable = require('./routes/timetable.js').generateWeeklyTimetable ||
    eval(require('fs').readFileSync('./routes/timetable.js', 'utf8').match(/async function generateWeeklyTimetable[\s\S]*?^}/m)[0]);

// Run Test
(async () => {
    try {
        console.log('=== TESTING STRICT TEACHER AVAILABILITY ===');
        console.log('Dr. Strict: ONLY Monday 16:30-17:30 (4:30-5:30 PM)');
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
        console.log('Working Days:', result.workingDays);
        console.log('');

        console.log('=== DETAILED SCHEDULE ===');
        result.schedule.forEach(day => {
            console.log(`\n${day.dayName} (${day.slots.length} slots):`);
            day.slots.forEach(slot => {
                console.log(`  ${slot.startTime}-${slot.endTime} | ${slot.subjectCode} | ${slot.facultyName} | ${slot.room}`);
            });
        });

        // VERIFICATION
        console.log('\n=== CRITICAL VERIFICATION ===');

        let violations = 0;

        // 1. Check Dr. Strict's schedule
        console.log('\n1. Checking Dr. Strict Availability (ONLY Mon 16:30-17:30):');
        result.schedule.forEach(day => {
            day.slots.forEach(slot => {
                if (slot.faculty === 'teacher_strict') {
                    const isValid = day.dayName === 'Monday' &&
                        slot.startTime === '16:30' &&
                        slot.endTime === '17:30';

                    if (!isValid) {
                        console.error(`   ❌ VIOLATION: Dr. Strict assigned ${day.dayName} ${slot.startTime}-${slot.endTime}`);
                        violations++;
                    } else {
                        console.log(`   ✅ VALID: Dr. Strict assigned ${day.dayName} ${slot.startTime}-${slot.endTime}`);
                    }
                }
            });
        });

        // 2. Check Room A on Monday
        console.log('\n2. Checking Room A Availability (Unavailable Mon 10:00-16:00):');
        const mondaySchedule = result.schedule.find(d => d.dayName === 'Monday');
        if (mondaySchedule) {
            mondaySchedule.slots.forEach(slot => {
                if (slot.room === 'Room A') {
                    const slotStart = slot.startTime;
                    const isInUnavailableWindow = slotStart >= '10:00' && slotStart < '16:00';

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
        console.log('\n3. Checking Break Violations:');
        let breakViolations = 0;
        result.schedule.forEach(day => {
            day.slots.forEach(slot => {
                const breakConflict = breaks.find(b =>
                    b.day === day.dayName &&
                    ((slot.startTime >= b.startTime && slot.startTime < b.endTime) ||
                        (slot.endTime > b.startTime && slot.endTime <= b.endTime))
                );
                if (breakConflict) {
                    console.error(`   ❌ Break Violation: ${day.dayName} ${slot.startTime}-${slot.endTime}`);
                    breakViolations++;
                }
            });
        });
        if (breakViolations === 0) {
            console.log('   ✅ No break violations');
        }
        violations += breakViolations;

        // 4. Check Section Conflicts (double-booking)
        console.log('\n4. Checking Section Double-Booking:');
        let doubleBooking = 0;
        result.schedule.forEach(day => {
            const timeSlotMap = {};
            day.slots.forEach(slot => {
                const key = `${slot.startTime}-${slot.endTime}`;
                if (timeSlotMap[key]) {
                    console.error(`   ❌ Double-booking: ${day.dayName} ${slot.startTime}-${slot.endTime} has multiple classes`);
                    doubleBooking++;
                }
                timeSlotMap[key] = true;
            });
        });
        if (doubleBooking === 0) {
            console.log('   ✅ No section double-booking');
        }
        violations += doubleBooking;

        // 5. Check Distribution
        console.log('\n5. Checking Distribution:');
        const slotsPerDay = result.schedule.map(d => ({ day: d.dayName, count: d.slots.length }));
        slotsPerDay.forEach(d => {
            console.log(`   ${d.day}: ${d.count} classes`);
        });

        console.log('\n=== FINAL RESULT ===');
        if (violations === 0) {
            console.log('✅✅✅ ALL TESTS PASSED - No violations found!');
        } else {
            console.error(`❌❌❌ FAILED - ${violations} violation(s) found!`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
