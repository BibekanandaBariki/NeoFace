const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Branch = require('../models/Branch');
const Batch = require('../models/Batch');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { department, semester, includeDeleted } = req.query;
    const query = {};

    // By default, exclude deactivated subjects
    if (includeDeleted !== 'true') {
      query.isActive = true;
    }

    if (department) query.department = department;
    if (semester) query.semester = semester;

    // Students can only see their subjects
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        if (student.subjects && student.subjects.length > 0) {
        query._id = { $in: student.subjects };
        } else {
          // If student has no subjects assigned, try to find by department/semester
          query.department = student.department;
          query.semester = student.semester;
          // Auto-assign these subjects to the student
          const matchingSubjects = await Subject.find(query).select('_id');
          if (matchingSubjects.length > 0) {
            const subjectIds = matchingSubjects.map(s => s._id);
            student.subjects = subjectIds;
            await student.save();
            // Update subjects' students array
            await Subject.updateMany(
              { _id: { $in: subjectIds } },
              { $addToSet: { students: student._id } }
            );
            query._id = { $in: subjectIds };
          } else {
            return res.json([]);
          }
        }
      } else {
        return res.json([]);
      }
    }

    // Admins see subjects they teach
    if (req.user.role === 'admin') {
      query.faculty = req.user._id;
    }

    const subjects = await Subject.find(query)
      .populate('faculty', 'name email')
      .populate('students', 'name universityId')
      .sort({ createdAt: -1 });

    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subjects
// @desc    Create a new subject
// @access  Private (Admin, SuperAdmin)
router.post('/', [
  auth,
  authorize('admin', 'superadmin'),
  body('code').notEmpty().withMessage('Subject code is required'),
  body('name').notEmpty().withMessage('Subject name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Valid semester is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, name, department, semester, credits, students, timetable, faculty, section } = req.body;

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({ message: `Subject with code ${code} already exists` });
    }

    // Get branch information based on department
    const branch = await Branch.findOne({ code: department });
    if (!branch) {
      return res.status(400).json({ message: `Branch with code ${department} not found` });
    }

    // Find batch for this branch
    const batch = await Batch.findOne({ branch: branch._id });
    if (!batch) {
      return res.status(400).json({ message: 'No batch found for this branch' });
    }

    // SuperAdmin can assign any faculty, Admin can only assign themselves
    const facultyId = req.user.role === 'superadmin' && faculty 
      ? faculty 
      : req.user._id;

    // Auto-assign students based on department, semester, and section if not explicitly provided
    let assignedStudents = students || [];
    if (!students || students.length === 0) {
      const matchQuery = {
        department: department,
        semester: semester
      };
      // If subject has a section, only match students with that section (or no section)
      if (section) {
        matchQuery.$or = [
          { section: section },
          { section: null },
          { section: { $exists: false } }
        ];
      }
      const matchingStudents = await Student.find(matchQuery).select('_id');
      assignedStudents = matchingStudents.map(s => s._id);
    }

    const subject = await Subject.create({
      code,
      name,
      department,
      semester,
      section: section || null,
      credits: credits || 3,
      campus: branch.campus,
      program: branch.program,
      branch: branch._id,
      batch: batch._id,
      faculty: [{
        teacher: facultyId,
        role: 'primary',
        assignedSections: [section || 'A']
      }],
      students: assignedStudents,
      timetable: timetable || [],
      createdBy: req.user._id
    });

    // Update students' subject list
    if (assignedStudents.length > 0) {
      await Student.updateMany(
        { _id: { $in: assignedStudents } },
        { $addToSet: { subjects: subject._id } }
      );
    }

    const populatedSubject = await Subject.findById(subject._id)
      .populate('faculty', 'name email')
      .populate('students', 'name universityId');

    res.status(201).json(populatedSubject);
  } catch (error) {
    console.error('Create subject error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({ 
        message: `Subject with ${field} "${value}" already exists` 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create subject', 
      error: error.message 
    });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private (Admin, SuperAdmin)
router.put('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if admin owns this subject or is superadmin
    if (req.user.role === 'admin' && subject.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, timetable, students, credits } = req.body;

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(timetable && { timetable }),
        ...(students && { students }),
        ...(credits && { credits }),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('faculty', 'name email')
     .populate('students', 'name universityId');

    res.json(updatedSubject);
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject (soft delete by default, permanent with ?permanent=true)
// @access  Private (SuperAdmin only)
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    console.log(`SuperAdmin ${req.user.email} deleting subject: ${subject.name} (${permanent === 'true' ? 'PERMANENT' : 'SOFT'})`);

    // PERMANENT DELETION
    if (permanent === 'true') {
      // Delete related attendance records
      const Attendance = require('../models/Attendance');
      const attnResult = await Attendance.deleteMany({ subjectId: subject._id });
      console.log(`Deleted ${attnResult.deletedCount} attendance records for subject`);

      await Subject.findByIdAndDelete(req.params.id);
      console.log(`Subject ${subject.name} permanently deleted`);

      return res.json({ 
        message: 'Subject and all related data permanently deleted',
        deletedSubject: {
          code: subject.code,
          name: subject.name
        },
        attendanceRecordsDeleted: attnResult.deletedCount
      });
    }

    // SOFT DELETE (default)
    // Use findByIdAndUpdate to avoid validation issues with missing required fields
    await Subject.findByIdAndUpdate(req.params.id, {
      isActive: false,
      updatedAt: new Date()
    }, { runValidators: false });

    console.log(`Subject ${subject.name} deactivated`);

    const updatedSubject = await Subject.findById(req.params.id);
    res.json({ 
      message: 'Subject deactivated successfully',
      subject: updatedSubject,
      note: 'Use DELETE /api/subjects/:id?permanent=true to permanently remove'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

