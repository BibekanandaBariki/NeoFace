/**
 * Cleanup Orphaned Records Script
 * 
 * This script finds and optionally deletes orphaned User records
 * (User records without associated Student records)
 * 
 * Usage:
 *   node scripts/cleanup-orphaned.js [--dry-run] [--delete]
 * 
 *   --dry-run: Only show what would be deleted (default)
 *   --delete: Actually delete the orphaned records
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');

const args = process.argv.slice(2);
const dryRun = !args.includes('--delete');
const shouldDelete = args.includes('--delete');

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

    console.log(`\n🔍 Found ${orphanedUsers.length} orphaned User records:`);

    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned records found!');
      await mongoose.disconnect();
      return;
    }

    orphanedUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: ${user.email}`);
      console.log(`   University ID: ${user.universityId || 'N/A'}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.createdAt}`);
    });

    if (dryRun) {
      console.log(`\n⚠️  DRY RUN MODE - No records deleted`);
      console.log(`Run with --delete flag to actually delete these records`);
    } else {
      console.log(`\n🗑️  Deleting ${orphanedUsers.length} orphaned records...`);
      
      const userIds = orphanedUsers.map(u => u._id);
      const result = await User.deleteMany({ _id: { $in: userIds } });
      
      console.log(`✅ Deleted ${result.deletedCount} orphaned User records`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedRecords();

