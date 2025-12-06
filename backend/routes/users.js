const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @route   POST /api/users
// @desc    Create a new user (Admin)
// @access  Private (SuperAdmin only)
router.post('/', [
  auth,
  authorize('superadmin'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'student', 'campusadmin', 'hod']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department } = req.body;

    // Check if user exists (excluding soft-deleted users)
    const userExists = await User.findOne({ email, isDeleted: false });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if user was soft-deleted and can be restored
    const deletedUser = await User.findOne({ email, isDeleted: true });
    if (deletedUser) {
      // Restore the deleted user instead of creating a new one
      deletedUser.isDeleted = false;
      deletedUser.deletedAt = null;
      deletedUser.deletedBy = null;
      deletedUser.isActive = true;
      deletedUser.name = name;
      deletedUser.password = password;
      deletedUser.role = role;
      deletedUser.department = department;
      deletedUser.isVerified = true;
      deletedUser.updatedAt = new Date();
      await deletedUser.save();
      
      return res.status(200).json({
        message: 'User restored successfully (was previously deleted)',
        user: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          role: deletedUser.role,
          department: deletedUser.department,
          isVerified: deletedUser.isVerified,
          isActive: deletedUser.isActive
        }
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      isVerified: true,
      isActive: true
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isVerified: user.isVerified,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (excluding deleted unless requested)
// @access  Private (SuperAdmin only)
router.get('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { role, isActive, includeDeleted } = req.query;
    const query = {};

    if (role) {
      // Handle comma-separated roles
      if (role.includes(',')) {
        query.role = { $in: role.split(',') };
      } else {
        query.role = role;
      }
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // By default, exclude deleted users
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('deletedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (SuperAdmin can update all fields)
// @access  Private (SuperAdmin only)
router.put('/:id', [
  auth,
  authorize('superadmin'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, department, universityId, isActive, role, isVerified } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update all allowed fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (department !== undefined) user.department = department;
    if (universityId !== undefined) user.universityId = universityId;
    if (isActive !== undefined) user.isActive = isActive;
    if (role !== undefined) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;
    user.updatedAt = new Date();

    await user.save();

    // If updating a student's user, also update the Student record
    if (user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        if (name !== undefined) student.name = name;
        if (email !== undefined) student.email = email;
        if (department !== undefined) student.department = department;
        if (universityId !== undefined) student.universityId = universityId;
        await student.save();
      }
    }

    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/:id/password
// @desc    Change user password (SuperAdmin only)
// @access  Private (SuperAdmin only)
router.put('/:id/password', [
  auth,
  authorize('superadmin'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    let userId = req.params.id;

    // Validate userId is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId format:', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Permanently delete user and ALL related data (login credentials invalidated)
// @access  Private (SuperAdmin only)
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query; // ?permanent=true for immediate deletion
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot delete yourself
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Cannot delete other SuperAdmins
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete SuperAdmin accounts' });
    }

    // PERMANENT DELETION - Cannot be recovered
    if (permanent === 'true') {
      // If student, cascade delete Student, Attendance, and subject links
      if (targetUser.role === 'student') {
        const StudentModel = require('../models/Student');
        const Attendance = require('../models/Attendance');
        const Subject = require('../models/Subject');

        const student = await StudentModel.findOne({ userId: targetUser._id });
        if (student) {
          // Remove from subjects
          await Subject.updateMany(
            { students: student._id },
            { $pull: { students: student._id } }
          );
          // Delete all attendance records
          await Attendance.deleteMany({ studentId: student._id });
          // Delete student record
          await StudentModel.findByIdAndDelete(student._id);
          console.log(`Permanently deleted student record and ${await Attendance.countDocuments({ studentId: student._id })} attendance records`);
        }
      }

      // If admin/faculty, remove as faculty from subjects
      if (targetUser.role === 'admin') {
        const Subject = require('../models/Subject');
        await Subject.updateMany(
          { faculty: targetUser._id },
          { $set: { faculty: null } }
        );
      }

      // Finally delete the user account (login credentials permanently removed)
      await User.findByIdAndDelete(targetUser._id);

      console.log(`SuperAdmin ${req.user.email} permanently deleted user: ${targetUser.email} (${targetUser.role})`);
      
      return res.json({ 
        message: 'User and all related data permanently deleted. Login credentials are invalid. User can be re-registered with new account.',
        deletedUser: {
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role
        }
      });
    }
    
    // SOFT DELETE (Default) - Mark as deleted but keep data
    else {
      targetUser.isDeleted = true;
      targetUser.deletedAt = new Date();
      targetUser.deletedBy = req.user.id;
      targetUser.isActive = false; // Also deactivate
      await targetUser.save();
      
      // If student, also mark Student record as deleted
      if (targetUser.role === 'student') {
        const StudentModel = require('../models/Student');
        const student = await StudentModel.findOne({ userId: targetUser._id });
        if (student) {
          student.isDeleted = true;
          student.deletedAt = new Date();
          student.deletedBy = req.user.id;
          student.isActive = false;
          await student.save();
        }
      }
      
      console.log(`SuperAdmin ${req.user.email} soft-deleted user: ${targetUser.email} (${targetUser.role})`);
      
      return res.json({ 
        message: 'User account deactivated and marked as deleted. Login credentials are invalid.',
        note: 'Use ?permanent=true query parameter for complete permanent deletion including all data.',
        deletedUser: {
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role
        }
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/:id/restore
// @desc    Restore a soft-deleted user
// @access  Private (SuperAdmin only)
router.post('/:id/restore', auth, authorize('superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.isDeleted) {
      return res.status(400).json({ message: 'User is not deleted' });
    }
    
    // Restore user
    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedBy = null;
    user.isActive = true;
    await user.save();
    
    // If student, also restore Student record
    if (user.role === 'student') {
      const StudentModel = require('../models/Student');
      const student = await StudentModel.findOne({ userId: user._id });
      if (student) {
        student.isDeleted = false;
        student.deletedAt = null;
        student.deletedBy = null;
        student.isActive = true;
        await student.save();
      }
    }
    
    console.log(`SuperAdmin ${req.user.email} restored user: ${user.email}`);
    
    res.json({ 
      message: 'User account restored successfully. Login credentials are now active.',
      user: await User.findById(user._id).select('-password')
    });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/deleted/all
// @desc    Get all deleted users
// @access  Private (SuperAdmin only)
router.get('/deleted/all', auth, authorize('superadmin'), async (req, res) => {
  try {
    const deletedUsers = await User.find({ isDeleted: true })
      .select('-password')
      .populate('deletedBy', 'name email role')
      .sort({ deletedAt: -1 });
    
    res.json(deletedUsers);
  } catch (error) {
    console.error('Get deleted users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/cleanup/deleted-permanent
// @desc    Permanently remove ALL soft-deleted users and their data
// @access  Private (SuperAdmin only)
router.post('/cleanup/deleted-permanent', auth, authorize('superadmin'), async (req, res) => {
  try {
    console.log(`SuperAdmin ${req.user.email} initiated permanent cleanup of deleted users`);
    
    const results = {
      usersDeleted: 0,
      studentsDeleted: 0,
      attendanceDeleted: 0,
      details: []
    };

    // 1. Find and permanently delete all soft-deleted users
    const deletedUsers = await User.find({ isDeleted: true });
    
    for (const user of deletedUsers) {
      const userDetail = {
        email: user.email,
        name: user.name,
        role: user.role,
        deletedAt: user.deletedAt
      };

      // If student, delete associated records
      if (user.role === 'student') {
        const student = await Student.findOne({ userId: user._id });
        if (student) {
          // Remove from subjects
          const Subject = require('../models/Subject');
          await Subject.updateMany(
            { students: student._id },
            { $pull: { students: student._id } }
          );

          // Delete attendance
          const Attendance = require('../models/Attendance');
          const attnResult = await Attendance.deleteMany({ studentId: student._id });
          results.attendanceDeleted += attnResult.deletedCount;
          userDetail.attendanceRecords = attnResult.deletedCount;

          // Delete student
          await Student.findByIdAndDelete(student._id);
          results.studentsDeleted++;
        }
      }

      // Delete user account
      await User.findByIdAndDelete(user._id);
      results.usersDeleted++;
      results.details.push(userDetail);
    }

    // 2. Also clean up soft-deleted students (orphaned)
    const deletedStudents = await Student.find({ isDeleted: true });
    for (const student of deletedStudents) {
      const Subject = require('../models/Subject');
      await Subject.updateMany(
        { students: student._id },
        { $pull: { students: student._id } }
      );

      const Attendance = require('../models/Attendance');
      const attnResult = await Attendance.deleteMany({ studentId: student._id });
      results.attendanceDeleted += attnResult.deletedCount;

      await Student.findByIdAndDelete(student._id);
      results.studentsDeleted++;
    }

    console.log(`Cleanup complete: ${results.usersDeleted} users, ${results.studentsDeleted} students, ${results.attendanceDeleted} attendance records`);

    res.json({
      message: 'All soft-deleted users and data permanently removed',
      summary: {
        usersDeleted: results.usersDeleted,
        studentsDeleted: results.studentsDeleted,
        attendanceRecordsDeleted: results.attendanceDeleted
      },
      deletedUsers: results.details,
      note: 'These users can now be re-registered with fresh accounts'
    });
  } catch (error) {
    console.error('Permanent cleanup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/cleanup/orphaned
// @desc    Clean up orphaned user accounts (users without student/admin records)
// @access  Private (SuperAdmin only)
router.get('/cleanup/orphaned', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { dryRun } = req.query; // ?dryRun=true to preview without deleting
    
    // Find all users
    const allUsers = await User.find({ role: { $in: ['student', 'admin'] } });
    const orphanedUsers = [];
    
    for (const user of allUsers) {
      if (user.role === 'student') {
        const student = await Student.findOne({ userId: user._id });
        if (!student) {
          orphanedUsers.push({
            userId: user._id,
            email: user.email,
            name: user.name,
            role: 'student',
            reason: 'No Student record found'
          });
        }
      } else if (user.role === 'admin') {
        // Check if admin has any subjects assigned
        const Subject = require('../models/Subject');
        const hasSubjects = await Subject.findOne({ faculty: user._id });
        // Note: We don't delete admins, just report them
        if (!hasSubjects) {
          orphanedUsers.push({
            userId: user._id,
            email: user.email,
            name: user.name,
            role: 'admin',
            reason: 'No subjects assigned (informational only)'
          });
        }
      }
    }
    
    if (dryRun === 'true') {
      return res.json({
        message: 'Dry run - no changes made',
        orphanedCount: orphanedUsers.length,
        orphanedUsers,
        note: 'Remove ?dryRun=true to actually clean up orphaned student accounts'
      });
    }
    
    // Actually delete orphaned student users (not admins)
    const deletedUsers = [];
    for (const orphan of orphanedUsers) {
      if (orphan.role === 'student') {
        await User.findByIdAndDelete(orphan.userId);
        deletedUsers.push(orphan);
        console.log(`Cleaned up orphaned user: ${orphan.email}`);
      }
    }
    
    res.json({
      message: 'Orphaned user accounts cleaned up',
      deletedCount: deletedUsers.length,
      deletedUsers,
      adminCount: orphanedUsers.filter(u => u.role === 'admin').length,
      note: 'Admin accounts were not deleted (review manually)'
    });
  } catch (error) {
    console.error('Cleanup orphaned users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/stats/summary
// @desc    Get user/student statistics summary
// @access  Private (SuperAdmin only)
router.get('/stats/summary', auth, authorize('superadmin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const activeUsers = await User.countDocuments({ isDeleted: false, isActive: true });
    const deletedUsers = await User.countDocuments({ isDeleted: true });
    
    const totalStudents = await Student.countDocuments({ isDeleted: false });
    const activeStudents = await Student.countDocuments({ isDeleted: false, isActive: true });
    const deletedStudents = await Student.countDocuments({ isDeleted: true });
    
    // Check for orphans
    const allUserIds = await User.find({ role: 'student', isDeleted: false }).distinct('_id');
    const linkedUserIds = await Student.find({ isDeleted: false }).distinct('userId');
    const orphanedUserCount = allUserIds.filter(id => !linkedUserIds.some(lid => lid.equals(id))).length;
    
    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        deleted: deletedUsers,
        orphaned: orphanedUserCount
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        deleted: deletedStudents
      },
      dataConsistency: orphanedUserCount === 0 ? 'OK' : 'WARNING',
      message: orphanedUserCount > 0 
        ? `Found ${orphanedUserCount} orphaned user accounts. Use POST /api/users/cleanup/orphaned to fix.`
        : 'All user accounts are properly linked'
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;




