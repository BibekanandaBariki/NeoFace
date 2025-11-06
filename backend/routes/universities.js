const express = require('express');
const router = express.Router();
const University = require('../models/University');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/universities
// @desc    Get all universities
// @access  SuperAdmin only
router.get('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const universities = await University.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json(universities);
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/universities/:id
// @desc    Get university by ID
// @access  SuperAdmin only
router.get('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const university = await University.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    res.json(university);
  } catch (error) {
    console.error('Get university error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/universities
// @desc    Create new university
// @access  SuperAdmin only
router.post('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      contactInfo,
      establishedYear,
      accreditation
    } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({ 
        message: 'Name and code are required' 
      });
    }

    // Check if university code already exists
    const existingUniversity = await University.findOne({ code: code.toUpperCase() });
    if (existingUniversity) {
      return res.status(400).json({ 
        message: `University with code ${code} already exists` 
      });
    }

    const university = await University.create({
      name,
      code: code.toUpperCase(),
      address,
      contactInfo,
      establishedYear,
      accreditation,
      createdBy: req.user.id
    });

    const populated = await University.findById(university._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'University created successfully',
      university: populated
    });
  } catch (error) {
    console.error('Create university error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'University code already exists' 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/universities/:id
// @desc    Update university
// @access  SuperAdmin only
router.put('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    const {
      name,
      code,
      address,
      contactInfo,
      establishedYear,
      accreditation,
      isActive
    } = req.body;

    // Update fields
    if (name) university.name = name;
    if (code) university.code = code.toUpperCase();
    if (address) university.address = address;
    if (contactInfo) university.contactInfo = contactInfo;
    if (establishedYear) university.establishedYear = establishedYear;
    if (accreditation) university.accreditation = accreditation;
    if (isActive !== undefined) university.isActive = isActive;
    
    university.updatedAt = Date.now();
    await university.save();

    const updated = await University.findById(university._id)
      .populate('createdBy', 'name email');

    res.json({
      message: 'University updated successfully',
      university: updated
    });
  } catch (error) {
    console.error('Update university error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'University code already exists' 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/universities/:id
// @desc    Delete university (soft delete by default, permanent with ?permanent=true)
// @access  SuperAdmin only
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const university = await University.findById(req.params.id);
    
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    console.log(`SuperAdmin ${req.user.email} deleting university: ${university.name} (${permanent === 'true' ? 'PERMANENT' : 'SOFT'})`);

    // PERMANENT DELETION
    if (permanent === 'true') {
      // Check for related data
      const Campus = require('../models/Campus');
      const campusCount = await Campus.countDocuments({ university: req.params.id });

      if (campusCount > 0) {
        return res.status(400).json({ 
          message: `Cannot permanently delete university. ${campusCount} campus(es) are using this university.`,
          suggestion: 'Please delete all related campuses first, or use soft delete to deactivate.'
        });
      }

      await University.findByIdAndDelete(req.params.id);
      console.log(`University ${university.name} permanently deleted`);

      return res.json({ 
        message: 'University permanently deleted',
        deletedUniversity: {
          code: university.code,
          name: university.name
        }
      });
    }

    // Check if any active campuses are using this university
    const Campus = require('../models/Campus');
    const campusCount = await Campus.countDocuments({ 
      university: req.params.id,
      isActive: true 
    });

    if (campusCount > 0) {
      return res.status(400).json({ 
        message: `Cannot deactivate university. ${campusCount} active campus(es) are using this university.` 
      });
    }

    // SOFT DELETE
    university.isActive = false;
    university.updatedAt = Date.now();
    await university.save();

    console.log(`University ${university.name} deactivated`);

    res.json({ 
      message: 'University deactivated successfully',
      university,
      note: 'Use DELETE /api/universities/:id?permanent=true to permanently remove'
    });
  } catch (error) {
    console.error('Delete university error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;