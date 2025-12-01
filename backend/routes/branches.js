const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const mongoose = require('mongoose');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/branches
// @desc    Get all branches
// @access  Private (but allow students to lookup by code)
router.get('/', async (req, res) => {
  try {
    const { campus, program, course, university, school, isActive, code } = req.query;
    const query = {};
    
    // If only code is provided and no other filters, allow students to access
    const isCodeLookupOnly = code && !campus && !program && !course && !university && !school && isActive === undefined;
    
    // For code lookups, don't require authentication
    if (!isCodeLookupOnly) {
      // Apply auth middleware manually for other queries
      let authPassed = false;
      const authResult = await new Promise((resolve) => {
        auth(req, res, () => {
          authPassed = true;
          resolve();
        });
      });
      
      if (!authPassed) return; // Auth failed, response already sent
      
      // Check authorization for non-code lookups
      if (req.user.role !== 'superadmin' && req.user.role !== 'campusadmin') {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
    }
    
    if (campus) query.campus = campus;
    if (program) query.program = program;
    if (course) query.course = course;
    if (university) query.university = university;
    if (school) query.school = school;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (code) query.code = code;

    const branches = await Branch.find(query)
      .populate('course', 'name code fullName')
      .populate('campus', 'name code')
      .populate('program', 'name shortName code')
      .populate('university', 'name code')
      .populate('school', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email')
      .sort({ campus: 1, program: 1, name: 1 });

    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/branches/:id
// @desc    Get branch by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('course', 'name code fullName')
      .populate('campus', 'name code location')
      .populate('program', 'name shortName duration')
      .populate('university', 'name code')
      .populate('school', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json(branch);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/branches
// @desc    Create new branch
// @access  SuperAdmin, CampusAdmin
router.post('/', auth, authorize('superadmin', 'campusadmin'), async (req, res) => {
  try {
    const {
      code,
      name,
      shortName,
      course,
      program,
      university,
      campus,
      school,
      hod,
      description,
      intake
    } = req.body;

    // Validation
    if (!code || !name || !shortName || !course || !program || !university || !campus || !school) {
      return res.status(400).json({ 
        message: 'Code, name, shortName, course, program, university, campus, and school are required' 
      });
    }

    // CampusAdmin can only create branches for their campus
    if (req.user.role === 'campusadmin') {
      if (!req.user.assignedCampus || req.user.assignedCampus.toString() !== campus) {
        return res.status(403).json({ 
          message: 'You can only create branches for your assigned campus' 
        });
      }
    }

    // Check if branch already exists for this course, program and campus
    const existingBranch = await Branch.findOne({ 
      code: code.toUpperCase(),
      course,
      program,
      campus
    });
    
    if (existingBranch) {
      return res.status(400).json({ 
        message: `Branch ${code} already exists for this course, program and campus` 
      });
    }

    // Coerce HOD to null if empty string or not provided
    let hodId = (typeof hod === 'string' && hod.trim() === '') ? null : hod;
    if (hodId && !mongoose.Types.ObjectId.isValid(hodId)) {
      return res.status(400).json({ message: 'Invalid HOD user id' });
    }

    const branch = await Branch.create({
      code: code.toUpperCase(),
      name,
      shortName,
      course,
      program,
      university,
      campus,
      school,
      hod: hodId,
      description,
      intake: intake || 60,
      isActive: true,
      createdBy: req.user.id
    });

    const populated = await Branch.findById(branch._id)
      .populate('course', 'name code fullName')
      .populate('campus', 'name code')
      .populate('program', 'name shortName')
      .populate('university', 'name code')
      .populate('school', 'name code')
      .populate('hod', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Branch created successfully',
      branch: populated
    });
  } catch (error) {
    console.error('Create branch error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Branch already exists for this course, program and campus' 
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/branches/:id
// @desc    Update branch
// @access  SuperAdmin, CampusAdmin, HOD
router.put('/:id', auth, authorize('superadmin', 'campusadmin', 'hod'), async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Access control
    if (req.user.role === 'campusadmin') {
      if (!req.user.assignedCampus || req.user.assignedCampus.toString() !== branch.campus.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'hod') {
      if (!req.user.managedBranch || req.user.managedBranch.toString() !== branch._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const {
      name,
      shortName,
      course,
      program,
      university,
      campus,
      school,
      hod,
      description,
      intake,
      isActive
    } = req.body;

    // Update fields
    if (name) branch.name = name;
    if (shortName) branch.shortName = shortName;
    if (course) branch.course = course;
    if (program) branch.program = program;
    if (university) branch.university = university;
    if (campus) branch.campus = campus;
    if (school) branch.school = school;
    if (hod !== undefined) {
      branch.hod = (typeof hod === 'string' && hod.trim() === '') ? null : hod;
    }
    if (description !== undefined) branch.description = description;
    if (intake) branch.intake = intake;
    if (isActive !== undefined) branch.isActive = isActive;
    
    branch.updatedAt = Date.now();
    await branch.save();

    const updated = await Branch.findById(branch._id)
      .populate('course', 'name code fullName')
      .populate('campus', 'name code')
      .populate('program', 'name shortName')
      .populate('university', 'name code')
      .populate('school', 'name code')
      .populate('hod', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Branch updated successfully',
      branch: updated
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/branches/:id
// @desc    Delete branch (soft delete by default, permanent with ?permanent=true)
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    console.log(`SuperAdmin ${req.user.email} deleting branch: ${branch.name} (${permanent === 'true' ? 'PERMANENT' : 'SOFT'})`);

    // PERMANENT DELETION
    if (permanent === 'true') {
      // Check for related data
      const Batch = require('../models/Batch');
      const batchCount = await Batch.countDocuments({ branch: req.params.id });

      if (batchCount > 0) {
        return res.status(400).json({ 
          message: `Cannot permanently delete branch. ${batchCount} batch(es) are using this branch.`,
          suggestion: 'Please delete all related batches first, or use soft delete to deactivate.'
        });
      }

      await Branch.findByIdAndDelete(req.params.id);
      console.log(`Branch ${branch.name} permanently deleted`);

      return res.json({ 
        message: 'Branch permanently deleted',
        deletedBranch: {
          code: branch.code,
          name: branch.name
        }
      });
    }

    // Check if any active batches are using this branch
    const Batch = require('../models/Batch');
    const batchCount = await Batch.countDocuments({ 
      branch: req.params.id,
      isActive: true 
    });

    if (batchCount > 0) {
      return res.status(400).json({ 
        message: `Cannot deactivate branch. ${batchCount} active batch(es) are using this branch.` 
      });
    }

    // SOFT DELETE
    branch.isActive = false;
    branch.updatedAt = Date.now();
    await branch.save();

    console.log(`Branch ${branch.name} deactivated`);

    res.json({ 
      message: 'Branch deactivated successfully',
      branch,
      note: 'Use DELETE /api/branches/:id?permanent=true to permanently remove'
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/branches/:id/stats
// @desc    Get branch statistics
// @access  Private
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const Student = require('../models/Student');
    const Subject = require('../models/Subject');

    const branchId = req.params.id;

    const [batches, students, subjects] = await Promise.all([
      Batch.countDocuments({ branch: branchId, isActive: true }),
      Student.countDocuments({ branch: branchId, isActive: true, isDeleted: false }),
      Subject.countDocuments({ branch: branchId, isActive: true })
    ]);

    res.json({
      branchId,
      statistics: {
        totalBatches: batches,
        totalStudents: students,
        totalSubjects: subjects
      }
    });
  } catch (error) {
    console.error('Get branch stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;











