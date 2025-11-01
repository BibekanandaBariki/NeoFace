/**
 * Cleanup Orphaned Records Script
 * 
 * This script finds and optionally deletes orphaned records and fixes references:
 * - Orphaned Users (role=student without Student)
 * - Orphaned Students (no User) with cascade (Attendance, Subject links)
 * - Attendance referencing non-existing Student/Subject
 * - Subject.students references to missing Students
 * - Subject.faculty referencing missing Users -> set to null
 * 
 * Usage:
 *   node scripts/cleanup-orphaned.js [--dry-run] [--delete] [--delete-inactive]
 * 
 *   --dry-run: Only show what would be deleted (default)
 *   --delete: Actually delete the orphaned records
 *   --delete-inactive: Also delete users with isActive=false
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');

const args = process.argv.slice(2);
const dryRun = !args.includes('--delete');
const shouldDelete = args.includes('--delete');
const deleteInactive = args.includes('--delete-inactive');

async function cleanupOrphanedRecords() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neoface';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all student-role users
    const studentUsers = await User.find({ role: 'student' });
    console.log(`\n📊 Found ${studentUsers.length} users with 'student' role`);

    // Find all students
    const students = await Student.find();
    const studentUserIds = new Set(students.map(s => s.userId.toString()));
    console.log(`📊 Found ${students.length} student records`);

    // Find orphaned users (student role but no associated student record)
    const orphanedUsers = studentUsers.filter(user => !studentUserIds.has(user._id.toString()));

    // Find orphaned students (no corresponding User)
    const userIdsSet = new Set((await User.find({}, '_id')).map(u => u._id.toString()));
    const orphanedStudents = students.filter(s => !userIdsSet.has(s.userId.toString()));

    // Find subjects with missing faculty
    const subjects = await Subject.find();
    const subjectFixes = subjects.filter(sub => sub.faculty && !userIdsSet.has(sub.faculty.toString()));

    // Find subject student refs to missing students
    const studentIdsSet = new Set(students.map(s => s._id.toString()));
    const subjectStudentPulls = subjects
      .map(sub => ({
        _id: sub._id,
        missing: sub.students.filter(stId => !studentIdsSet.has(stId.toString()))
      }))
      .filter(x => x.missing.length > 0);

    // Find attendance referencing missing student or subject
    const attendances = await Attendance.find({}, 'studentId subjectId');
    const subjectIdsSet = new Set(subjects.map(s => s._id.toString()));
    const orphanedAttendance = attendances.filter(a =>
      !studentIdsSet.has(a.studentId?.toString?.() || '') ||
      !subjectIdsSet.has(a.subjectId?.toString?.() || '')
    );

    console.log(`\n🔍 Orphaned Users (student without Student): ${orphanedUsers.length}`);
    console.log(`🔍 Orphaned Students (no User): ${orphanedStudents.length}`);
    console.log(`🔧 Subjects with missing faculty to null: ${subjectFixes.length}`);
    console.log(`🔧 Subjects with ${subjectStudentPulls.reduce((a,b)=>a+b.missing.length,0)} missing student references across ${subjectStudentPulls.length} subjects`);
    console.log(`🗑️  Orphaned Attendance to delete: ${orphanedAttendance.length}`);

    if (deleteInactive) {
      const inactiveUsers = await User.find({ isActive: false });
      console.log(`🗑️  Inactive users to delete: ${inactiveUsers.length}`);
      if (!dryRun && inactiveUsers.length) {
        await User.deleteMany({ _id: { $in: inactiveUsers.map(u => u._id) } });
        console.log(`✅ Deleted ${inactiveUsers.length} inactive users`);
      }
    }

    if (dryRun) {
      console.log(`\n⚠️  DRY RUN MODE - No records deleted`);
      console.log(`Run with --delete to apply deletions and fixes`);
    } else {
      // Delete orphaned users
      if (orphanedUsers.length) {
        await User.deleteMany({ _id: { $in: orphanedUsers.map(u => u._id) } });
        console.log(`✅ Deleted ${orphanedUsers.length} orphaned Users`);
      }
      // Cascade delete orphaned students
      for (const s of orphanedStudents) {
        await Attendance.deleteMany({ studentId: s._id });
        await Subject.updateMany({ students: s._id }, { $pull: { students: s._id } });
        await Student.deleteOne({ _id: s._id });
      }
      if (orphanedStudents.length) console.log(`✅ Deleted ${orphanedStudents.length} orphaned Students (with attendance + subject links)`);

      // Set missing faculty to null
      for (const sub of subjectFixes) {
        await Subject.updateOne({ _id: sub._id }, { $set: { faculty: null } });
      }
      if (subjectFixes.length) console.log(`✅ Set faculty to null for ${subjectFixes.length} subjects`);

      // Pull missing student refs from subjects
      for (const item of subjectStudentPulls) {
        await Subject.updateOne({ _id: item._id }, { $pull: { students: { $in: item.missing } } });
      }
      if (subjectStudentPulls.length) console.log(`✅ Cleaned student references in ${subjectStudentPulls.length} subjects`);

      // Delete orphaned attendance
      if (orphanedAttendance.length) {
        await Attendance.deleteMany({ _id: { $in: orphanedAttendance.map(a => a._id) } });
        console.log(`✅ Deleted ${orphanedAttendance.length} orphaned Attendance records`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedRecords();

