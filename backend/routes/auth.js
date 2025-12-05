const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, universityId, department } = req.body;

    // Check if user exists (including deleted users)
    const existingUser = await User.findOne({ email });
    if (existingUser && !existingUser.isDeleted) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // If user was deleted, allow re-registration with new data
    if (existingUser && existingUser.isDeleted) {
      // Permanently delete the old record before creating new one
      await User.findByIdAndDelete(existingUser._id);
      console.log(`Permanently deleted old user record for re-registration: ${email}`);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      universityId,
      department,
      isVerified: role === 'student' ? false : true
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('\n=== LOGIN REQUEST ===');
    console.log('Email:', req.body.email);
    console.log('Password length:', req.body.password?.length);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user - check if deleted is explicitly true (not just missing field)
    const user = await User.findOne({ email });
    console.log('User found:', user ? `${user.email} (${user.role})` : 'NOT FOUND');

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        message: 'Invalid credentials. Please check your email and password.'
      });
    }

    console.log('User isDeleted:', user.isDeleted);
    console.log('User isActive:', user.isActive);

    // Check if user is explicitly deleted
    if (user.isDeleted === true) {
      console.log('❌ User is marked as deleted');
      return res.status(401).json({
        message: 'Account has been deleted. Please contact the administrator for re-registration.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    // Check if user is active
    if (user.isActive === false) {
      console.log('❌ User account is not active');
      return res.status(401).json({ message: 'Account is deactivated. Please contact the administrator.' });
    }

    const token = generateToken(user._id);
    console.log('✅ Login successful for:', user.email);
    console.log('=== LOGIN SUCCESS ===\n');

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        universityId: user.universityId,
        department: user.department,
        isVerified: user.isVerified,
        faceRegistered: user.faceRegistered
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    // For students, also check registration status from Student model
    if (user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id });

      if (student) {
        // Copy student-specific information to user object
        user.department = student.department || user.department;
        user.section = student.section;
        user.semester = student.semester;

        // Check if face is actually registered (has embedding)
        const hasFaceEmbedding = student.faceEmbedding && student.faceEmbedding.length > 0;

        if (hasFaceEmbedding) {
          // Face embedding exists - check approval status
          if (student.registrationStatus === 'approved') {
            // Fully approved and registered
            user.faceRegistered = true;
            user.registrationStatus = 'approved';
          } else if (student.registrationStatus === 'pending') {
            // Registered but pending approval
            user.faceRegistered = false;
            user.registrationStatus = 'pending';
          } else if (student.registrationStatus === 'rejected') {
            // Registration was rejected
            user.faceRegistered = false;
            user.registrationStatus = 'rejected';
          } else {
            // Has embedding but no status set (shouldn't happen, but handle it)
            user.faceRegistered = false;
            user.registrationStatus = 'pending';
          }
        } else {
          // Face is NOT registered yet (no embedding)
          user.faceRegistered = false;
          user.registrationStatus = null; // null means not registered
        }
      } else {
        // No student record found, face is not registered
        user.faceRegistered = false;
        user.registrationStatus = null;
      }
    }

    // Ensure registrationStatus is included in response (convert to plain object if needed)
    const responseUser = user.toObject ? user.toObject() : user;

    // Explicitly add student-specific fields for students
    if (user.role === 'student') {
      responseUser.department = user.department;
      responseUser.section = user.section;
      responseUser.semester = user.semester;
    }

    if (!responseUser.hasOwnProperty('registrationStatus')) {
      responseUser.registrationStatus = user.registrationStatus || null;
    }

    // Ensure consistent ID field (use 'id' like in login response)
    if (responseUser._id && !responseUser.id) {
      responseUser.id = responseUser._id;
    }

    console.log('API /auth/me response for student:', {
      userId: responseUser.id || responseUser._id,
      role: responseUser.role,
      faceRegistered: responseUser.faceRegistered,
      registrationStatus: responseUser.registrationStatus
    });

    res.json(responseUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify if current token is valid and user is active
// @access  Private
router.post('/verify-token', auth, async (req, res) => {
  try {
    // If middleware passes, user is valid
    res.json({
      valid: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        isDeleted: req.user.isDeleted || false
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

// @route   GET /api/auth/reset-superadmin-emergency
// @desc    Emergency password reset for SuperAdmin (Temporary)
// @access  Public (to allow recovery)
router.get('/reset-superadmin-emergency', async (req, res) => {
  try {
    const email = 'bibekbariki786@gmail.com';
    const newPassword = 'Attitude321@11';
    const bcrypt = require('bcryptjs');

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'SuperAdmin user not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ EMERGENCY: SuperAdmin password reset to: ${newPassword}`);
    res.json({ message: `Success! Password reset to: ${newPassword}` });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;













