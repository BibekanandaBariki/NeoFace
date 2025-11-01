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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

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
    if (!responseUser.hasOwnProperty('registrationStatus')) {
      responseUser.registrationStatus = user.registrationStatus || null;
    }
    
    console.log('API /auth/me response for student:', {
      userId: responseUser._id,
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

module.exports = router;

