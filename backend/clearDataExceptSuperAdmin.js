// Script to clear all data except SuperAdmin account
const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/User');
const University = require('./models/University');
const Campus = require('./models/Campus');
const School = require('./models/School');
const Program = require('./models/Program');
const Course = require('./models/Course');
const Branch = require('./models/Branch');
const Batch = require('./models/Batch');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');
const WeeklyTimetable = require('./models/WeeklyTimetable');
const Semester = require('./models/Semester');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neoface', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find the SuperAdmin to preserve it
    const superAdmin = await User.findOne({ email: 'bibekbariki786@gmail.com' });
    if (!superAdmin) {
      console.log('SuperAdmin not found. Exiting.');
      process.exit(1);
    }
    
    console.log('Found SuperAdmin:', superAdmin.name, superAdmin.email);
    
    // Clear all data except SuperAdmin
    console.log('Clearing all data except SuperAdmin...');
    
    // Delete all users except SuperAdmin
    const deletedUsers = await User.deleteMany({ 
      _id: { $ne: superAdmin._id },
      email: { $ne: 'bibekbariki786@gmail.com' }
    });
    console.log(`Deleted ${deletedUsers.deletedCount} users`);
    
    // Delete all universities
    const deletedUniversities = await University.deleteMany({});
    console.log(`Deleted ${deletedUniversities.deletedCount} universities`);
    
    // Delete all campuses
    const deletedCampuses = await Campus.deleteMany({});
    console.log(`Deleted ${deletedCampuses.deletedCount} campuses`);
    
    // Delete all schools
    const deletedSchools = await School.deleteMany({});
    console.log(`Deleted ${deletedSchools.deletedCount} schools`);
    
    // Delete all programs
    const deletedPrograms = await Program.deleteMany({});
    console.log(`Deleted ${deletedPrograms.deletedCount} programs`);
    
    // Delete all courses
    const deletedCourses = await Course.deleteMany({});
    console.log(`Deleted ${deletedCourses.deletedCount} courses`);
    
    // Delete all branches
    const deletedBranches = await Branch.deleteMany({});
    console.log(`Deleted ${deletedBranches.deletedCount} branches`);
    
    // Delete all batches
    const deletedBatches = await Batch.deleteMany({});
    console.log(`Deleted ${deletedBatches.deletedCount} batches`);
    
    // Delete all students
    const deletedStudents = await Student.deleteMany({});
    console.log(`Deleted ${deletedStudents.deletedCount} students`);
    
    // Delete all subjects
    const deletedSubjects = await Subject.deleteMany({});
    console.log(`Deleted ${deletedSubjects.deletedCount} subjects`);
    
    // Delete all attendance records
    const deletedAttendance = await Attendance.deleteMany({});
    console.log(`Deleted ${deletedAttendance.deletedCount} attendance records`);
    
    // Delete all timetables
    const deletedTimetables = await WeeklyTimetable.deleteMany({});
    console.log(`Deleted ${deletedTimetables.deletedCount} timetables`);
    
    // Delete all semesters
    const deletedSemesters = await Semester.deleteMany({});
    console.log(`Deleted ${deletedSemesters.deletedCount} semesters`);
    
    console.log('\n✅ All data cleared except SuperAdmin account!');
    console.log('\nSuperAdmin credentials:');
    console.log('Email: bibekbariki786@gmail.com');
    console.log('Password: Attitude321@11');
    
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
});