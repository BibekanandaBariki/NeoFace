const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Program = require('../models/Program');
const School = require('../models/School');
const Campus = require('../models/Campus');
const University = require('../models/University');
const mongoose = require('mongoose');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get all courses
// @access  SuperAdmin, University Admin, Campus Admin
router.get('/', auth, async (req, res) => {
  try {
    const { isActive, program, university, campus, school } = req.query;
    const query = {};
    
    // Apply filters
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (program) query.program = program;
    if (university) query.university = university;
    if (campus) query.campus = campus;
    if (school) query.school = school;

    // Role-based filtering
    if (req.user.role === 'campusadmin') {
      const campus = await Campus.findOne({ principal: req.user.id });
      if (campus) {
        query.campus = campus._id;
      } else {
        return res.status(403).json({ message: 'No campus assigned to this admin' });
      }
    } else if (req.user.role === 'universityadmin') {
      // University admins can only see courses in their university
      // This would require tracking which university the admin belongs to
    }

    const courses = await Course.find(query)
      .populate('program', 'name code shortName')
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('school', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  SuperAdmin, University Admin, Campus Admin
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('program', 'name code shortName')
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('school', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Role-based access control
    if (req.user.role === 'campusadmin') {
      const campus = await Campus.findOne({ principal: req.user.id });
      if (!campus || course.campus.toString() !== campus._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'universityadmin') {
      // Similar university-based access control would go here
    }

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  SuperAdmin only
router.post('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const {
      code,
      name,
      fullName,
      program,
      university,
      campus,
      school,
      hod,
      description,
      credits
    } = req.body;

    // Validation
    if (!code || !name || !fullName || !program || !university || !campus || !school) {
      return res.status(400).json({ 
        message: 'Code, name, full name, program, university, campus, and school are required' 
      });
    }

    // Verify program exists and belongs to the university, campus, and school
    const programDoc = await Program.findById(program);
    if (!programDoc) {
      return res.status(400).json({ message: 'Program not found' });
    }

    if (programDoc.university.toString() !== university) {
      return res.status(400).json({ 
        message: 'Program does not belong to the specified university' 
      });
    }

    if (programDoc.campus.toString() !== campus) {
      return res.status(400).json({ 
        message: 'Program does not belong to the specified campus' 
      });
    }

    if (programDoc.school.toString() !== school) {
      return res.status(400).json({ 
        message: 'Program does not belong to the specified school' 
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: code.toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({ 
        message: `Course with code ${code} already exists` 
      });
    }

    // Coerce HOD to null if empty string or not provided
    let hodId = (typeof hod === 'string' && hod.trim() === '') ? null : hod;
    if (hodId && !mongoose.Types.ObjectId.isValid(hodId)) {
      return res.status(400).json({ message: 'Invalid HOD user id' });
    }

    const course = await Course.create({
      code: code.toUpperCase(),
      name,
      fullName,
      program,
      university,
      campus,
      school,
      hod: hodId,
      description,
      credits: credits || 0,
      createdBy: req.user.id
    });

    const populated = await Course.findById(course._id)
      .populate('program', 'name code shortName')
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('school', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Course created successfully',
      course: populated
    });
  } catch (error) {
    console.error('Create course error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Course code already exists' 
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  SuperAdmin only
router.put('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const {
      name,
      fullName,
      program,
      university,
      campus,
      school,
      hod,
      description,
      credits,
      isActive
    } = req.body;

    // Update fields
    if (name) course.name = name;
    if (fullName) course.fullName = fullName;
    if (program) course.program = program;
    if (university) course.university = university;
    if (campus) course.campus = campus;
    if (school) course.school = school;
    if (hod !== undefined) {
      course.hod = (typeof hod === 'string' && hod.trim() === '') ? null : hod;
    }
    if (description !== undefined) course.description = description;
    if (credits !== undefined) course.credits = credits;
    if (isActive !== undefined) course.isActive = isActive;
    
    course.updatedAt = Date.now();
    await course.save();

    const updated = await Course.findById(course._id)
      .populate('program', 'name code shortName')
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('school', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Course updated successfully',
      course: updated
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course (soft delete by default, permanent with ?permanent=true)
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log(`SuperAdmin ${req.user.email} deleting course: ${course.name} (${permanent === 'true' ? 'PERMANENT' : 'SOFT'})`);

    // PERMANENT DELETION
    if (permanent === 'true') {
      // Check for related data
      const Batch = require('../models/Batch');
      const relatedBatches = await Batch.countDocuments({ course: course._id });

      if (relatedBatches > 0) {
        return res.status(400).json({ 
          message: `Cannot permanently delete course. ${relatedBatches} batch(es) are using this course.`,
          suggestion: 'Please delete all related batches first, or use soft delete to deactivate.'
        });
      }

      await Course.findByIdAndDelete(req.params.id);
      console.log(`Course ${course.name} permanently deleted`);

      return res.json({ 
        message: 'Course permanently deleted',
        deletedCourse: {
          code: course.code,
          name: course.name
        }
      });
    }

    // SOFT DELETE
    course.isActive = false;
    course.updatedAt = Date.now();
    await course.save();

    console.log(`Course ${course.name} deactivated`);

    res.json({ 
      message: 'Course deactivated successfully',
      course,
      note: 'Use DELETE /api/courses/:id?permanent=true to permanently remove'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;