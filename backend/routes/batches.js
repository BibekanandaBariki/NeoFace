const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/batches
// @desc    Get all batches
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { campus, program, branch, course, university, school, isActive, isCurrent } = req.query;
    const query = {};
    
    if (campus) query.campus = campus;
    if (program) query.program = program;
    if (branch) query.branch = branch;
    if (course) query.course = course;
    if (university) query.university = university;
    if (school) query.school = school;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    let batches = await Batch.find(query)
      .populate('course', 'name code fullName')
      .populate('campus', 'name code')
      .populate('program', 'name shortName')
      .populate('branch', 'name shortName code')
      .populate('university', 'name code')
      .populate('school', 'name code')
      .populate('createdBy', 'name email')
      .sort({ admissionYear: -1, branch: 1 });

    // Filter by isCurrent if specified
    if (isCurrent === 'true') {
      batches = batches.filter(batch => batch.isCurrent());
    }

    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/batches/:id
// @desc    Get batch by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('course', 'name code fullName')
      .populate('campus', 'name code')
      .populate('program', 'name shortName duration')
      .populate('branch', 'name shortName code')
      .populate('university', 'name code')
      .populate('school', 'name code')
      .populate('createdBy', 'name email');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/batches
// @desc    Create new batch
// @access  SuperAdmin, CampusAdmin
router.post('/', auth, authorize('superadmin', 'campusadmin'), async (req, res) => {
  try {
    const {
      admissionYear,
      passOutYear,
      course,
      program,
      branch,
      university,
      campus,
      school,
      numberOfSections,
      sections
    } = req.body;

    // Validation
    if (!admissionYear || !passOutYear || !course || !program || !branch || !university || !campus || !school) {
      return res.status(400).json({ 
        message: 'Admission year, passout year, course, program, branch, university, campus, and school are required' 
      });
    }

    // CampusAdmin can only create batches for their campus
    if (req.user.role === 'campusadmin') {
      if (!req.user.assignedCampus || req.user.assignedCampus.toString() !== campus) {
        return res.status(403).json({ 
          message: 'You can only create batches for your assigned campus' 
        });
      }
    }

    const year = `${admissionYear}-${passOutYear}`;

    // Check if batch already exists
    const existingBatch = await Batch.findOne({ 
      year,
      branch,
      campus
    });
    
    if (existingBatch) {
      return res.status(400).json({ 
        message: `Batch ${year} already exists for this branch and campus` 
      });
    }

    // Generate sections array
    let sectionArray = sections || [];
    if (!sections && numberOfSections) {
      sectionArray = Array.from({ length: numberOfSections }, (_, i) => 
        String.fromCharCode(65 + i) // 'A', 'B', 'C', etc.
      );
    }

    const batch = await Batch.create({
      year,
      admissionYear,
      passOutYear,
      course,
      program,
      branch,
      university,
      campus,
      school,
      numberOfSections: sectionArray.length,
      sections: sectionArray,
      totalStudents: 0,
      currentSemester: 1,
      isActive: true,
      createdBy: req.user.id
    });

    const populated = await Batch.findById(batch._id)
      .populate('course', 'name code fullName')
      .populate('campus', 'name code')
      .populate('program', 'name shortName')
      .populate('branch', 'name shortName')
      .populate('university', 'name code')
      .populate('school', 'name code')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Batch created successfully',
      batch: populated
    });
  } catch (error) {
    console.error('Create batch error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Batch already exists for this branch and campus' 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/batches/:id
// @desc    Update batch
// @access  SuperAdmin, CampusAdmin
router.put('/:id', auth, authorize('superadmin', 'campusadmin'), async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Access control
    if (req.user.role === 'campusadmin') {
      if (!req.user.assignedCampus || req.user.assignedCampus.toString() !== batch.campus.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const {
      course,
      program,
      branch,
      university,
      campus,
      school,
      numberOfSections,
      sections,
      currentSemester,
      totalStudents,
      isActive
    } = req.body;

    // Update fields
    if (course) batch.course = course;
    if (program) batch.program = program;
    if (branch) batch.branch = branch;
    if (university) batch.university = university;
    if (campus) batch.campus = campus;
    if (school) batch.school = school;
    if (numberOfSections) batch.numberOfSections = numberOfSections;
    if (sections) batch.sections = sections;
    if (currentSemester) batch.currentSemester = currentSemester;
    if (totalStudents !== undefined) batch.totalStudents = totalStudents;
    if (isActive !== undefined) batch.isActive = isActive;
    
    batch.updatedAt = Date.now();
    await batch.save();

    const updated = await Batch.findById(batch._id)
      .populate('course', 'name code fullName')
      .populate('campus', 'name code')
      .populate('program', 'name shortName')
      .populate('branch', 'name shortName')
      .populate('university', 'name code')
      .populate('school', 'name code')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Batch updated successfully',
      batch: updated
    });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/batches/:id/promote
// @desc    Promote batch to next semester
// @access  SuperAdmin, CampusAdmin
router.put('/:id/promote', auth, authorize('superadmin', 'campusadmin'), async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('program', 'duration');
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Access control
    if (req.user.role === 'campusadmin') {
      if (!req.user.assignedCampus || req.user.assignedCampus.toString() !== batch.campus.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check if can promote
    if (batch.currentSemester >= batch.program.duration.semesters) {
      return res.status(400).json({ 
        message: 'Batch is already in final semester' 
      });
    }

    batch.currentSemester += 1;
    batch.updatedAt = Date.now();
    await batch.save();

    res.json({
      message: `Batch promoted to semester ${batch.currentSemester}`,
      batch
    });
  } catch (error) {
    console.error('Promote batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/batches/:id
// @desc    Delete batch (soft delete by default, permanent with ?permanent=true)
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    console.log(`SuperAdmin ${req.user.email} deleting batch: ${batch.year} (${permanent === 'true' ? 'PERMANENT' : 'SOFT'})`);

    // PERMANENT DELETION
    if (permanent === 'true') {
      // Check for related data
      const Student = require('../models/Student');
      const studentCount = await Student.countDocuments({ batch: req.params.id });

      if (studentCount > 0) {
        return res.status(400).json({ 
          message: `Cannot permanently delete batch. ${studentCount} student(s) are in this batch.`,
          suggestion: 'Please delete all related students first, or use soft delete to deactivate.'
        });
      }

      await Batch.findByIdAndDelete(req.params.id);
      console.log(`Batch ${batch.year} permanently deleted`);

      return res.json({ 
        message: 'Batch permanently deleted',
        deletedBatch: {
          year: batch.year,
          admissionYear: batch.admissionYear
        }
      });
    }

    // Check if any active students are in this batch
    const Student = require('../models/Student');
    const studentCount = await Student.countDocuments({ 
      batch: req.params.id,
      isActive: true,
      isDeleted: false
    });

    if (studentCount > 0) {
      return res.status(400).json({ 
        message: `Cannot deactivate batch. ${studentCount} active student(s) are in this batch.` 
      });
    }

    // SOFT DELETE
    batch.isActive = false;
    batch.updatedAt = Date.now();
    await batch.save();

    console.log(`Batch ${batch.year} deactivated`);

    res.json({ 
      message: 'Batch deactivated successfully',
      batch,
      note: 'Use DELETE /api/batches/:id?permanent=true to permanently remove'
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/batches/:id/students
// @desc    Get all students in a batch
// @access  Private
router.get('/:id/students', auth, async (req, res) => {
  try {
    const { section } = req.query;
    const Student = require('../models/Student');
    
    const query = { 
      batch: req.params.id,
      isActive: true,
      isDeleted: false
    };
    
    if (section) query.section = section.toUpperCase();

    const students = await Student.find(query)
      .populate('campus', 'name code')
      .populate('branch', 'name shortName')
      .sort({ section: 1, rollNumber: 1 });

    res.json(students);
  } catch (error) {
    console.error('Get batch students error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;





