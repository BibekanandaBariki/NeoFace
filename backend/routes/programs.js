const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/programs
// @desc    Get all programs
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { level, isActive, university, campus, school } = req.query;
    const query = {};
    
    if (level) query.level = level;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (university) query.university = university;
    if (campus) query.campus = campus;
    if (school) query.school = school;

    const programs = await Program.find(query)
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('school', 'name code')
      .populate('createdBy', 'name email')
      .sort({ level: 1, name: 1 });

    res.json(programs);
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/programs/:id
// @desc    Get program by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('school', 'name code')
      .populate('createdBy', 'name email');

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json(program);
  } catch (error) {
    console.error('Get program error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/programs
// @desc    Create new program
// @access  SuperAdmin only
router.post('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const {
      code,
      name,
      shortName,
      level,
      university,
      campus,
      school,
      years,
      semesters,
      eligibilityCriteria,
      description
    } = req.body;

    // Validation
    if (!code || !name || !shortName || !level || !university || !campus || !school || !years || !semesters) {
      return res.status(400).json({ 
        message: 'Code, name, shortName, level, university, campus, school, years, and semesters are required' 
      });
    }

    // Check if program code already exists
    const existingProgram = await Program.findOne({ code: code.toUpperCase() });
    if (existingProgram) {
      return res.status(400).json({ 
        message: `Program with code ${code} already exists` 
      });
    }

    const program = await Program.create({
      code: code.toUpperCase(),
      name,
      shortName,
      level,
      university,
      campus,
      school,
      duration: {
        years,
        semesters
      },
      eligibilityCriteria,
      description,
      isActive: true,
      createdBy: req.user.id
    });

    const populated = await Program.findById(program._id)
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('school', 'name code')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Program created successfully',
      program: populated
    });
  } catch (error) {
    console.error('Create program error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Program code already exists' 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/programs/:id
// @desc    Update program
// @access  SuperAdmin only
router.put('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const {
      name,
      shortName,
      level,
      university,
      campus,
      school,
      years,
      semesters,
      eligibilityCriteria,
      description,
      isActive
    } = req.body;

    // Update fields
    if (name) program.name = name;
    if (shortName) program.shortName = shortName;
    if (level) program.level = level;
    if (university) program.university = university;
    if (campus) program.campus = campus;
    if (school) program.school = school;
    if (years || semesters) {
      program.duration = {
        years: years || program.duration.years,
        semesters: semesters || program.duration.semesters
      };
    }
    if (eligibilityCriteria !== undefined) program.eligibilityCriteria = eligibilityCriteria;
    if (description !== undefined) program.description = description;
    if (isActive !== undefined) program.isActive = isActive;
    
    program.updatedAt = Date.now();
    await program.save();

    const updated = await Program.findById(program._id)
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('school', 'name code')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Program updated successfully',
      program: updated
    });
  } catch (error) {
    console.error('Update program error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/programs/:id
// @desc    Delete program (soft delete by default, permanent with ?permanent=true)
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const program = await Program.findById(req.params.id);
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    console.log(`SuperAdmin ${req.user.email} deleting program: ${program.name} (${permanent === 'true' ? 'PERMANENT' : 'SOFT'})`);

    // PERMANENT DELETION
    if (permanent === 'true') {
      // Check for related data
      const Branch = require('../models/Branch');
      const branchCount = await Branch.countDocuments({ program: req.params.id });

      if (branchCount > 0) {
        return res.status(400).json({ 
          message: `Cannot permanently delete program. ${branchCount} branch(es) are using this program.`,
          suggestion: 'Please delete all related branches first, or use soft delete to deactivate.'
        });
      }

      await Program.findByIdAndDelete(req.params.id);
      console.log(`Program ${program.name} permanently deleted`);

      return res.json({ 
        message: 'Program permanently deleted',
        deletedProgram: {
          code: program.code,
          name: program.name
        }
      });
    }

    // Check if any active branches are using this program
    const Branch = require('../models/Branch');
    const branchCount = await Branch.countDocuments({ 
      program: req.params.id,
      isActive: true 
    });

    if (branchCount > 0) {
      return res.status(400).json({ 
        message: `Cannot deactivate program. ${branchCount} active branch(es) are using this program.` 
      });
    }

    // SOFT DELETE
    program.isActive = false;
    program.updatedAt = Date.now();
    await program.save();

    console.log(`Program ${program.name} deactivated`);

    res.json({ 
      message: 'Program deactivated successfully',
      program,
      note: 'Use DELETE /api/programs/:id?permanent=true to permanently remove'
    });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
