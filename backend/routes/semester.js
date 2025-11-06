const express = require('express');
const router = express.Router();
const Semester = require('../models/Semester');
const Branch = require('../models/Branch');
const Batch = require('../models/Batch');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/semesters
// @desc    Get all semesters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { branch, section, academicYear, isActive } = req.query;
    
    const query = {};
    if (branch) query.branch = branch;
    if (section) query.section = section;
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const semesters = await Semester.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ academicYear: -1, semesterNumber: 1 });
    
    res.json(semesters);
  } catch (error) {
    console.error('Get semesters error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/semesters/:id
// @desc    Get semester by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    res.json(semester);
  } catch (error) {
    console.error('Get semester error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/semesters
// @desc    Create new semester
// @access  Admin, SuperAdmin
router.post('/', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const {
      name,
      semesterNumber,
      academicYear,
      branch,
      section,
      startDate,
      endDate,
      holidays
    } = req.body;
    
    // Validation
    if (!name || !semesterNumber || !academicYear || !branch || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check date validity
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    // Get branch information to populate campus and program
    const branchInfo = await Branch.findById(branch);
    if (!branchInfo) {
      return res.status(400).json({ message: 'Branch not found' });
    }
    
    // Find batch for this branch
    const batch = await Batch.findOne({ branch });
    if (!batch) {
      return res.status(400).json({ message: 'No batch found for this branch' });
    }
    
    // Check for overlapping semesters
    const overlapping = await Semester.findOne({
      branch,
      section: section || null,
      semesterNumber,
      academicYear,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });
    
    if (overlapping) {
      return res.status(400).json({ 
        message: 'A semester with overlapping dates already exists for this branch/section' 
      });
    }
    
    const semester = await Semester.create({
      name,
      semesterNumber,
      academicYear,
      campus: branchInfo.campus,
      program: branchInfo.program,
      branch,
      batch: batch._id,
      section: section || null,
      startDate: start,
      endDate: end,
      holidays: holidays || [],
      createdBy: req.user.id
    });
    
    const populated = await Semester.findById(semester._id)
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      message: 'Semester created successfully',
      semester: populated
    });
  } catch (error) {
    console.error('Create semester error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Semester already exists for this branch, section, and academic year' 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/semesters/:id
// @desc    Update semester
// @access  Admin, SuperAdmin
router.put('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    const {
      name,
      startDate,
      endDate,
      holidays,
      isActive
    } = req.body;
    
    // Update allowed fields
    if (name) semester.name = name;
    if (startDate) {
      const start = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (start >= end) {
          return res.status(400).json({ message: 'End date must be after start date' });
        }
      } else if (start >= semester.endDate) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      semester.startDate = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (end <= semester.startDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      semester.endDate = end;
    }
    if (holidays !== undefined) semester.holidays = holidays;
    if (isActive !== undefined) semester.isActive = isActive;
    
    semester.updatedBy = req.user.id;
    semester.updatedAt = Date.now();
    
    await semester.save();
    
    const updated = await Semester.findById(semester._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    res.json({
      message: 'Semester updated successfully',
      semester: updated
    });
  } catch (error) {
    console.error('Update semester error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/semesters/:id
// @desc    Delete semester
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    await Semester.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Delete semester error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/semesters/active/current
// @desc    Get currently active semesters
// @access  Private
router.get('/active/current', auth, async (req, res) => {
  try {
    const today = new Date();
    
    const semesters = await Semester.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('createdBy', 'name email');
    
    res.json(semesters);
  } catch (error) {
    console.error('Get active semesters error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
