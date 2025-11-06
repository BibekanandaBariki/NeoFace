const express = require('express');
const router = express.Router();
const School = require('../models/School');
const Campus = require('../models/Campus');
const University = require('../models/University');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/schools
// @desc    Get all schools
// @access  SuperAdmin, University Admin, Campus Admin
router.get('/', auth, async (req, res) => {
  try {
    const { isActive, university, campus } = req.query;
    const query = {};
    
    // Apply filters
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (university) query.university = university;
    if (campus) query.campus = campus;

    // Role-based filtering
    if (req.user.role === 'campusadmin') {
      const campus = await Campus.findOne({ principal: req.user.id });
      if (campus) {
        query.campus = campus._id;
      } else {
        return res.status(403).json({ message: 'No campus assigned to this admin' });
      }
    } else if (req.user.role === 'universityadmin') {
      // University admins can only see schools in their university
      // This would require tracking which university the admin belongs to
      // For now, we'll implement this when we have university admin structure
    }

    const schools = await School.find(query)
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json(schools);
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/schools/:id
// @desc    Get school by ID
// @access  SuperAdmin, University Admin, Campus Admin
router.get('/:id', auth, async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email');

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Role-based access control
    if (req.user.role === 'campusadmin') {
      const campus = await Campus.findOne({ principal: req.user.id });
      if (!campus || school.campus.toString() !== campus._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'universityadmin') {
      // Similar university-based access control would go here
    }

    res.json(school);
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/schools
// @desc    Create new school
// @access  SuperAdmin only
router.post('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const {
      code,
      name,
      fullName,
      university,
      campus,
      description,
      hod,
      establishedYear
    } = req.body;

    // Validation
    if (!code || !name || !fullName || !university || !campus) {
      return res.status(400).json({ 
        message: 'Code, name, full name, university, and campus are required' 
      });
    }

    // Verify university exists
    const universityDoc = await University.findById(university);
    if (!universityDoc) {
      return res.status(400).json({ message: 'University not found' });
    }

    // Verify campus exists and belongs to the university
    const campusDoc = await Campus.findById(campus);
    if (!campusDoc) {
      return res.status(400).json({ message: 'Campus not found' });
    }

    if (campusDoc.university.toString() !== university) {
      return res.status(400).json({ 
        message: 'Campus does not belong to the specified university' 
      });
    }

    // Check if school code already exists
    const existingSchool = await School.findOne({ code: code.toUpperCase() });
    if (existingSchool) {
      return res.status(400).json({ 
        message: `School with code ${code} already exists` 
      });
    }

    const school = await School.create({
      code: code.toUpperCase(),
      name,
      fullName,
      university,
      campus,
      description,
      hod,
      establishedYear,
      createdBy: req.user.id
    });

    const populated = await School.findById(school._id)
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'School created successfully',
      school: populated
    });
  } catch (error) {
    console.error('Create school error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'School code already exists' 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/schools/:id
// @desc    Update school
// @access  SuperAdmin only
router.put('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const {
      name,
      fullName,
      university,
      campus,
      description,
      hod,
      isActive,
      establishedYear
    } = req.body;

    // Update fields
    if (name) school.name = name;
    if (fullName) school.fullName = fullName;
    if (university) school.university = university;
    if (campus) school.campus = campus;
    if (description !== undefined) school.description = description;
    if (hod !== undefined) school.hod = hod;
    if (isActive !== undefined) school.isActive = isActive;
    if (establishedYear) school.establishedYear = establishedYear;
    
    school.updatedAt = Date.now();
    await school.save();

    const updated = await School.findById(school._id)
      .populate('university', 'name code')
      .populate('campus', 'name code')
      .populate('hod', 'name email employeeId')
      .populate('createdBy', 'name email');

    res.json({
      message: 'School updated successfully',
      school: updated
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/schools/:id
// @desc    Delete school (soft delete by default, permanent with ?permanent=true)
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    console.log(`SuperAdmin ${req.user.email} deleting school: ${school.name} (${permanent === 'true' ? 'PERMANENT' : 'SOFT'})`);

    // PERMANENT DELETION
    if (permanent === 'true') {
      // Check for related data
      const Program = require('../models/Program');
      const relatedPrograms = await Program.countDocuments({ school: school._id });

      if (relatedPrograms > 0) {
        return res.status(400).json({ 
          message: `Cannot permanently delete school. ${relatedPrograms} program(s) are using this school.`,
          suggestion: 'Please delete all related programs first, or use soft delete to deactivate.'
        });
      }

      await School.findByIdAndDelete(req.params.id);
      console.log(`School ${school.name} permanently deleted`);

      return res.json({ 
        message: 'School permanently deleted',
        deletedSchool: {
          code: school.code,
          name: school.name
        }
      });
    }

    // SOFT DELETE
    school.isActive = false;
    school.updatedAt = Date.now();
    await school.save();

    console.log(`School ${school.name} deactivated`);

    res.json({ 
      message: 'School deactivated successfully',
      school,
      note: 'Use DELETE /api/schools/:id?permanent=true to permanently remove'
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;