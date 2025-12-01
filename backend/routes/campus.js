const express = require('express');
const router = express.Router();
const Campus = require('../models/Campus');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/campus
// @desc    Get all campuses
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const campuses = await Campus.find(query)
      .populate('university', 'name code')
      .populate('principal', 'name email')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json(campuses);
  } catch (error) {
    console.error('Get campuses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/campus/:id
// @desc    Get campus by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const campus = await Campus.findById(req.params.id)
      .populate('university', 'name code')
      .populate('principal', 'name email employeeId')
      .populate('createdBy', 'name email');

    if (!campus) {
      return res.status(404).json({ message: 'Campus not found' });
    }

    res.json(campus);
  } catch (error) {
    console.error('Get campus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/campus
// @desc    Create new campus
// @access  SuperAdmin only
router.post('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const {
      code,
      name,
      university,
      location,
      contactInfo,
      principal,
      establishedYear
    } = req.body;

    // Validation
    if (!code || !name || !university) {
      return res.status(400).json({ message: 'Code, name, and university are required' });
    }

    // Check if campus code already exists
    const existingCampus = await Campus.findOne({ 
      $or: [{ code: code.toUpperCase() }, { name }] 
    });
    
    if (existingCampus) {
      return res.status(400).json({ 
        message: `Campus with code ${code} or name ${name} already exists` 
      });
    }

    const campus = await Campus.create({
      code: code.toUpperCase(),
      name,
      university,
      location,
      contactInfo,
      principal,
      establishedYear,
      isActive: true,
      createdBy: req.user.id
    });

    const populated = await Campus.findById(campus._id)
      .populate('university', 'name code')
      .populate('principal', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Campus created successfully',
      campus: populated
    });
  } catch (error) {
    console.error('Create campus error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Campus code or name already exists' 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/campus/:id
// @desc    Update campus
// @access  SuperAdmin only
router.put('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const campus = await Campus.findById(req.params.id);
    
    if (!campus) {
      return res.status(404).json({ message: 'Campus not found' });
    }

    const {
      name,
      university,
      location,
      contactInfo,
      principal,
      isActive,
      establishedYear
    } = req.body;

    // Update fields
    if (name) campus.name = name;
    if (university) campus.university = university;
    if (location) campus.location = location;
    if (contactInfo) campus.contactInfo = contactInfo;
    if (principal !== undefined) campus.principal = principal;
    if (isActive !== undefined) campus.isActive = isActive;
    if (establishedYear) campus.establishedYear = establishedYear;
    
    campus.updatedAt = Date.now();
    await campus.save();

    const updated = await Campus.findById(campus._id)
      .populate('university', 'name code')
      .populate('principal', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Campus updated successfully',
      campus: updated
    });
  } catch (error) {
    console.error('Update campus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/campus/:id
// @desc    Delete campus (soft delete by default, permanent with ?permanent=true)
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const campus = await Campus.findById(req.params.id);
    
    if (!campus) {
      return res.status(404).json({ message: 'Campus not found' });
    }

    console.log(`SuperAdmin ${req.user.email} deleting campus: ${campus.name} (${permanent === 'true' ? 'PERMANENT' : 'SOFT'})`);

    // PERMANENT DELETION
    if (permanent === 'true') {
      // Check for related data
      const Program = require('../models/Program');
      const Branch = require('../models/Branch');
      const Batch = require('../models/Batch');
      const Student = require('../models/Student');

      const relatedPrograms = await Program.countDocuments({ campus: campus._id });
      const relatedBranches = await Branch.countDocuments({ campus: campus._id });
      const relatedBatches = await Batch.countDocuments({ campus: campus._id });
      const relatedStudents = await Student.countDocuments({ campus: campus._id });

      if (relatedPrograms > 0 || relatedBranches > 0 || relatedBatches > 0 || relatedStudents > 0) {
        return res.status(400).json({ 
          message: 'Cannot permanently delete campus with related data',
          relatedData: {
            programs: relatedPrograms,
            branches: relatedBranches,
            batches: relatedBatches,
            students: relatedStudents
          },
          suggestion: 'Please delete all related programs, branches, batches, and students first, or use soft delete to deactivate.'
        });
      }

      await Campus.findByIdAndDelete(req.params.id);
      console.log(`Campus ${campus.name} permanently deleted`);

      return res.json({ 
        message: 'Campus permanently deleted',
        deletedCampus: {
          code: campus.code,
          name: campus.name
        }
      });
    }

    // SOFT DELETE - just mark as inactive
    campus.isActive = false;
    campus.updatedAt = Date.now();
    await campus.save();

    console.log(`Campus ${campus.name} deactivated`);

    res.json({ 
      message: 'Campus deactivated successfully',
      campus,
      note: 'Use DELETE /api/campus/:id?permanent=true to permanently remove'
    });
  } catch (error) {
    console.error('Delete campus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/campus/:id/toggle-active
// @desc    Toggle campus active status
// @access  SuperAdmin only
router.patch('/:id/toggle-active', auth, authorize('superadmin'), async (req, res) => {
  try {
    const campus = await Campus.findById(req.params.id);
    
    if (!campus) {
      return res.status(404).json({ message: 'Campus not found' });
    }

    campus.isActive = !campus.isActive;
    campus.updatedAt = Date.now();
    await campus.save();

    const updated = await Campus.findById(campus._id)
      .populate('principal', 'name email')
      .populate('createdBy', 'name email');

    res.json({ 
      message: `Campus ${campus.isActive ? 'activated' : 'deactivated'} successfully`,
      campus: updated
    });
  } catch (error) {
    console.error('Toggle campus active error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/campus/:id/stats
// @desc    Get campus statistics
// @access  Private
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const Branch = require('../models/Branch');
    const Batch = require('../models/Batch');
    const Student = require('../models/Student');

    const campusId = req.params.id;

    const [
      branches,
      batches,
      students
    ] = await Promise.all([
      Branch.countDocuments({ campus: campusId, isActive: true }),
      Batch.countDocuments({ campus: campusId, isActive: true }),
      Student.countDocuments({ campus: campusId, isActive: true, isDeleted: false })
    ]);

    res.json({
      campusId,
      statistics: {
        totalBranches: branches,
        totalBatches: batches,
        totalStudents: students
      }
    });
  } catch (error) {
    console.error('Get campus stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;





