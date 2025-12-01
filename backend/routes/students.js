const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Batch = require('../models/Batch');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students (excluding deleted by default)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    let query = {};
    
    // By default, exclude deleted students
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    // Students can only see themselves
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id, ...query });
      if (!student) {
        return res.json([]);
      }
      return res.json([student]);
    }

    // Admins see students in their subjects
    if (req.user.role === 'admin') {
      const Subject = require('../models/Subject');
      const subjects = await Subject.find({ 'faculty.teacher': req.user._id });
      const studentIds = subjects.reduce((acc, subject) => {
        return acc.concat(subject.students.map(s => s.toString()));
      }, []);
      if (studentIds.length > 0) {
        query._id = { $in: studentIds };
      } else {
        return res.json([]);
      }
    }

    const students = await Student.find(query)
      .populate('userId', 'name email isActive isDeleted')
      .populate('subjects', 'code name')
      .populate('deletedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/students
// @desc    Create a new student
// @access  Private (Admin, SuperAdmin)
router.post('/', [
  auth,
  authorize('admin', 'superadmin'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('universityId').trim().notEmpty().withMessage('University ID is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('semester').custom((value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 8) {
      throw new Error('Semester must be a number between 1 and 8');
    }
    return true;
  }).withMessage('Valid semester is required')
], async (req, res) => {
  try {
    // Debug: Log incoming request BEFORE validation
    console.log('\n=== CREATE STUDENT REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Auth User:', req.user?.email || 'Not found', 'Role:', req.user?.role || 'Not found');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Present' : 'Missing'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ VALIDATION ERRORS:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    console.log('✅ Validation passed');

    const { name, email, universityId, department, semester, year, subjects, section } = req.body;

    // Log section value for debugging
    console.log('Section value received:', section, 'Type:', typeof section);

    // Validate and normalize data
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedSemester = typeof semester === 'string' ? parseInt(semester, 10) : semester;
    const normalizedYear = year ? (typeof year === 'string' ? parseInt(year, 10) : year) : new Date().getFullYear();

    // Validate required fields (additional check)
    if (!name || !normalizedEmail || !universityId || !department || !normalizedSemester) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, universityId, department, and semester are required' 
      });
    }

    // Validate semester range
    if (isNaN(normalizedSemester) || normalizedSemester < 1 || normalizedSemester > 8) {
      return res.status(400).json({ 
        message: 'Semester must be a number between 1 and 8' 
      });
    }

    // Check if student exists (excluding deleted unless being restored)
    const existingStudent = await Student.findOne({ 
      $or: [{ email: normalizedEmail }, { universityId: universityId.trim() }],
      isDeleted: false
    });

    if (existingStudent) {
      console.log('❌ Student already exists:', existingStudent.email);
      return res.status(400).json({ message: 'Student already exists with this email or university ID' });
    }

    // Check if user with this email exists (excluding deleted)
    const existingUser = await User.findOne({ email: normalizedEmail, isDeleted: false });
    if (existingUser) {
      console.log('❌ User with this email already exists:', existingUser.email, 'Role:', existingUser.role);
      
      // Check if it's an orphaned user (user exists but no student record)
      const orphanedStudent = await Student.findOne({ userId: existingUser._id });
      if (!orphanedStudent) {
        console.log('⚠️  Found orphaned User record (no associated Student). Attempting cleanup...');
        // Delete orphaned user to allow recreation
        await User.findByIdAndDelete(existingUser._id);
        console.log('✅ Cleaned up orphaned User record');
      } else {
        return res.status(400).json({ 
          message: `User with this email already exists (${existingUser.role}). Please use a different email.` 
        });
      }
    }

    // Also check for orphaned user by universityId (if provided and user exists)
    if (universityId) {
      const existingUserByUnivId = await User.findOne({ universityId: universityId.trim() });
      if (existingUserByUnivId) {
        console.log('Found User with same University ID:', existingUserByUnivId.email, 'Role:', existingUserByUnivId.role);
        const studentByUnivId = await Student.findOne({ userId: existingUserByUnivId._id });
        if (!studentByUnivId && existingUserByUnivId.role === 'student') {
          console.log('⚠️  Found orphaned User by University ID. Cleaning up...');
          await User.findByIdAndDelete(existingUserByUnivId._id);
          console.log('✅ Cleaned up orphaned User record by University ID');
        } else if (studentByUnivId) {
          console.log('❌ Student record exists with this University ID:', studentByUnivId.email);
          return res.status(400).json({ message: 'University ID already exists' });
        } else if (existingUserByUnivId.role !== 'student') {
          console.log('❌ User with this University ID exists but has different role:', existingUserByUnivId.role);
          return res.status(400).json({ 
            message: `University ID already exists for a ${existingUserByUnivId.role} account` 
          });
        }
      }
    }

    // Create user
    let user;
    try {
      console.log('Creating user with data:', {
        name: name.trim(),
        email: normalizedEmail,
        role: 'student',
        universityId: universityId.trim(),
        department: department.trim()
      });
      
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: universityId.trim(), // Default password, will be hashed by pre-save hook
        role: 'student',
        universityId: universityId.trim(),
        department: department.trim(),
        isVerified: true,
        isActive: true
      });
      
      console.log('User created successfully:', user._id);
    } catch (userError) {
      console.error('User creation error:', userError);
      console.error('Error details:', {
        message: userError.message,
        code: userError.code,
        keyPattern: userError.keyPattern,
        keyValue: userError.keyValue
      });
      return res.status(500).json({ 
        message: 'Failed to create user account', 
        error: userError.message,
        code: userError.code
      });
    }

    // Get branch information based on department
    const branch = await Branch.findOne({ code: department.trim() });
    if (!branch) {
      // Clean up user
      await User.findByIdAndDelete(user._id).catch(cleanupErr => {
        console.error('Failed to cleanup user:', cleanupErr);
      });
      return res.status(400).json({ message: `Branch with code ${department.trim()} not found` });
    }

    // Find batch for this branch
    const batch = await Batch.findOne({ branch: branch._id });
    if (!batch) {
      // Clean up user
      await User.findByIdAndDelete(user._id).catch(cleanupErr => {
        console.error('Failed to cleanup user:', cleanupErr);
      });
      return res.status(400).json({ message: 'No batch found for this branch' });
    }

    // Generate roll number (simple format: BRANCH-YEAR-001)
    const lastStudent = await Student.findOne({ branch: branch._id }).sort({ rollNumber: -1 });
    let rollNumber = '001';
    if (lastStudent) {
      const lastRoll = lastStudent.rollNumber;
      const lastNum = parseInt(lastRoll.split('-')[2] || '0');
      rollNumber = (lastNum + 1).toString().padStart(3, '0');
    }
    const rollNumberStr = `${branch.code}-${normalizedYear}-${rollNumber}`;

    // Create student record
    let student;
    try {
      const studentData = {
        userId: user._id,
        universityId: universityId.trim(),
        rollNumber: rollNumberStr,
        name: name.trim(),
        email: normalizedEmail,
        department: department.trim(),
        campus: branch.campus,
        program: branch.program,
        branch: branch._id,
        batch: batch._id,
        section: section ? section.trim() : 'A',
        currentSemester: normalizedSemester,
        semester: normalizedSemester, // For backward compatibility
        year: normalizedYear, // For backward compatibility
        subjects: subjects || [],
        createdBy: req.user._id,
        registrationStatus: null  // Explicitly set to null (face not registered yet)
      };
      
      console.log('Creating student with data:', {
        ...studentData,
        userId: studentData.userId.toString()
      });
      
      student = await Student.create(studentData);
      
      console.log('Student created successfully:', student._id);
    } catch (studentError) {
      // If student creation fails, clean up the user
      console.error('Student creation failed, cleaning up user:', user._id);
      await User.findByIdAndDelete(user._id).catch(cleanupErr => {
        console.error('Failed to cleanup user:', cleanupErr);
      });
      
      console.error('Student creation error:', studentError);
      console.error('Error details:', {
        message: studentError.message,
        code: studentError.code,
        keyPattern: studentError.keyPattern,
        keyValue: studentError.keyValue
      });
      
      return res.status(500).json({ 
        message: 'Failed to create student record', 
        error: studentError.message,
        code: studentError.code
      });
    }

    // Auto-assign to matching subjects
    try {
      const Subject = require('../models/Subject');
      const matchQuery = {
        department: department.trim(),
        semester: normalizedSemester  // Use normalized semester, not raw req.body.semester
      };
      
      // If student has a section, match subjects with same section or no section
      if (section && section.trim()) {
        matchQuery.$or = [
          { section: section.trim() },
          { section: null },
          { section: { $exists: false } }
        ];
      }
      
      console.log('Searching for matching subjects with query:', matchQuery);
      const matchingSubjects = await Subject.find(matchQuery);
      console.log(`Found ${matchingSubjects.length} matching subjects`);

      if (matchingSubjects.length > 0) {
        const subjectIds = matchingSubjects.map(s => s._id);
        student.subjects = subjectIds;
        await student.save();

        // Update subjects' students array
        await Subject.updateMany(
          { _id: { $in: subjectIds } },
          { $addToSet: { students: student._id } }
        );
        console.log(`Auto-assigned student to ${subjectIds.length} subjects`);
      }
    } catch (subjectError) {
      console.error('Error during subject auto-assignment (non-fatal):', subjectError);
      // Don't fail the request if subject assignment fails
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('userId', 'name email')
      .populate('subjects', 'code name');

    console.log('=== STUDENT CREATED SUCCESSFULLY ===');
    console.log('Student ID:', populatedStudent._id);
    console.log('Student Name:', populatedStudent.name);
    
    res.status(201).json(populatedStudent);
  } catch (error) {
    console.error('Create student error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while creating student', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('subjects', 'code name')
      .populate('createdBy', 'name email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check access permissions
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student (SuperAdmin can update all fields, Admin limited)
// @access  Private (Admin, SuperAdmin)
router.put('/:id', [
  auth,
  authorize('admin', 'superadmin'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Valid semester is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check permissions - Admin can only update students in their subjects
    if (req.user.role === 'admin') {
      const Subject = require('../models/Subject');
      const adminSubjects = await Subject.find({ 'faculty.teacher': req.user._id });
      const adminStudentIds = adminSubjects.reduce((acc, subj) => {
        return acc.concat(subj.students.map(s => s.toString()));
      }, []);
      
      if (!adminStudentIds.includes(student._id.toString())) {
        return res.status(403).json({ message: 'Access denied. You can only update students in your subjects.' });
      }
    }

    const { name, email, department, semester, section, subjects, universityId, year } = req.body;

    // Update student fields
    if (name !== undefined) student.name = name;
    if (email !== undefined) student.email = email;
    if (department !== undefined) student.department = department;
    if (semester !== undefined) student.semester = semester;
    if (section !== undefined) student.section = section || null;
    if (universityId !== undefined) student.universityId = universityId;
    if (year !== undefined) student.year = year;
    if (subjects !== undefined) student.subjects = subjects;
    student.updatedAt = new Date();

    await student.save();

    // Update user record if email or name changed
    if (email !== undefined || name !== undefined || department !== undefined || universityId !== undefined) {
      await User.findByIdAndUpdate(student.userId, {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(department !== undefined && { department }),
        ...(universityId !== undefined && { universityId }),
        updatedAt: new Date()
      });
    }

    const updatedStudent = await Student.findById(student._id)
      .populate('userId', 'name email')
      .populate('subjects', 'code name');

    res.json({
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/students/:id/face
// @desc    Update/replace student face data (SuperAdmin only)
// @access  Private (SuperAdmin only)
router.put('/:id/face', [
  auth,
  authorize('superadmin'),
  body('faceEmbedding').isArray().withMessage('Face embedding array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { faceEmbedding, registrationStatus } = req.body;
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update face data
    student.faceEmbedding = faceEmbedding;
    student.faceRegistered = faceEmbedding && faceEmbedding.length > 0;
    if (registrationStatus) {
      student.registrationStatus = registrationStatus;
    }
    await student.save();

    // Update user record
    await User.findByIdAndUpdate(student.userId, {
      faceEmbedding: faceEmbedding,
      faceRegistered: faceEmbedding && faceEmbedding.length > 0
    });

    const updatedStudent = await Student.findById(studentId)
      .populate('userId', 'name email');

    res.json({ 
      message: 'Face data updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update face data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Permanently delete student and all related data (User, Attendance, Subject links)
// @access  Private (Admin, SuperAdmin)
router.delete('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    console.log('=== DELETE STUDENT REQUEST ===');
    console.log('Student ID:', req.params.id);
    console.log('Deleted by:', req.user?.email, 'Role:', req.user?.role);
    console.log('Deletion type:', permanent === 'true' ? 'PERMANENT' : 'SOFT');

    const student = await Student.findById(req.params.id);
    
    if (!student) {
      console.log('Student not found');
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Found student:', student.name, 'Email:', student.email);
    console.log('Associated User ID:', student.userId);

    const userId = student.userId;

    // PERMANENT DELETION - Cannot be recovered
    if (permanent === 'true') {
      // Remove from subjects
      const Subject = require('../models/Subject');
      await Subject.updateMany(
        { students: student._id },
        { $pull: { students: student._id } }
      );
      console.log('Removed student from subjects');

      // Delete related attendance records
      const Attendance = require('../models/Attendance');
      const attnResult = await Attendance.deleteMany({ studentId: student._id });
      console.log(`Deleted ${attnResult.deletedCount} attendance records`);

      // Delete student record
      await Student.findByIdAndDelete(req.params.id);
      console.log('Student record permanently deleted');

      // Delete associated User record (login credentials removed)
      if (userId) {
        const deletedUser = await User.findByIdAndDelete(userId);
        if (deletedUser) {
          console.log('Associated User account permanently deleted:', deletedUser.email);
        } else {
          console.log('Warning: User record not found (may have been already deleted)');
        }
      }

      console.log('=== STUDENT PERMANENTLY DELETED ===');
      return res.json({ 
        message: 'Student, user account, and all related data permanently deleted',
        details: {
          studentName: student.name,
          email: student.email,
          attendanceRecords: attnResult.deletedCount,
          loginCredentials: 'permanently removed',
          canReRegister: true
        }
      });
    }
    
    // SOFT DELETE (Default) - Can be restored
    else {
      // Use findByIdAndUpdate to avoid validation issues with missing required fields
      await Student.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
        isActive: false
      }, { runValidators: false });
      console.log('Student record marked as deleted');

      // Also mark user account as deleted (invalidate login)
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.id,
          isActive: false
        }, { runValidators: false });
        console.log('User account marked as deleted (login disabled):', student.email);
      }

      console.log('=== STUDENT SOFT DELETED ===');
      return res.json({ 
        message: 'Student and user account marked as deleted (login disabled)',
        details: {
          studentName: student.name,
          email: student.email,
          loginStatus: 'disabled',
          dataPreserved: true,
          canBeRestored: true
        },
        note: 'Use DELETE /api/students/:id?permanent=true to permanently remove all data'
      });
    }
  } catch (error) {
    console.error('Delete student error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while deleting student',
      error: error.message 
    });
  }
});

module.exports = router;
