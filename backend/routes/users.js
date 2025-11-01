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
  body('role').isIn(['admin', 'student']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
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
// @desc    Get all users
// @access  Private (SuperAdmin only)
router.get('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
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
    const userId = req.params.id;

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
// @desc    Delete user
// @access  Private (SuperAdmin only)
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
