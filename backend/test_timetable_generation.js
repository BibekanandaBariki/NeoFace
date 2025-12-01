/**
 * Test script for timetable generation
 */
const TimetableGenerator = require('./services/timetableGenerator');

async function testTimetableGeneration() {
  console.log('Testing Timetable Generation...');
  
  // Create a generator instance
  const generator = new TimetableGenerator();
  
  // Test configuration
  const testConfig = {
    branch: 'test-branch-id',
    semester: 1,
    dailyHours: {
      startTime: '09:00',
      endTime: '17:00'
    },
    breaks: [
      { startTime: '11:00', endTime: '11:15' },
      { startTime: '13:00', endTime: '14:00' }
    ],
    teacherAvailability: [
      {
        teacherId: 'teacher-1',
        day: 'Monday',
        startTime: '09:00',
        endTime: '12:00'
      }
    ],
    roomAvailability: [
      {
        roomId: 'room-1',
        day: 'Monday',
        startTime: '09:00',
        endTime: '17:00'
      }
    ],
    rooms: [
      { id: 'room-1', name: 'Room 101', type: 'Theory' },
      { id: 'room-2', name: 'Lab 201', type: 'Lab' }
    ],
    offDay: 'Sunday'
  };
  
  try {
    // Initialize the generator
    await generator.initialize(testConfig);
    console.log('Generator initialized successfully');
    
    // Generate timetable
    const result = await generator.generate();
    console.log('Timetable generation result:', result);
    
    if (result.success) {
      console.log('✅ Timetable generated successfully!');
      console.log(`Scheduled ${result.scheduledSessions} out of ${result.totalSessions} sessions`);
    } else {
      console.log('❌ Failed to generate timetable');
      console.log('Unscheduled sessions:', result.unscheduledSessions.length);
    }
  } catch (error) {
    console.error('Error during timetable generation:', error);
  }
}

// Run the test
testTimetableGeneration();