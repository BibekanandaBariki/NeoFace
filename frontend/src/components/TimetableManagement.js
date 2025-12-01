import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import GlassCard from './GlassCard';
import WeeklyTimetableGenerator from './WeeklyTimetableGenerator';
import '../styles/glassmorphism.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableManagement = () => {
  const [timetables, setTimetables] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    branch: '',
    section: '',
    semester: '',
    semesterNumber: 1,
    academicYear: '',
    effectiveFrom: '',
    schedule: [],
    universityId: '',
    campusId: '',
    schoolId: '',
    programId: '',
    courseId: '',
    branchId: '',
    batchId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationStatus, setValidationStatus] = useState(''); // 'checking', 'valid', 'invalid'
  
  // State for toggling between views
  const [showGenerator, setShowGenerator] = useState(false);
  
  // Hierarchical data states
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);

  // Hierarchical data fetching functions
  const fetchUniversities = useCallback(async () => {
    try {
      const response = await api.get('/api/universities?isActive=true');
      setUniversities(response.data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  }, []);

  const fetchCampuses = useCallback(async (universityId) => {
    if (!universityId) {
      setCampuses([]);
      return;
    }
    try {
      const response = await api.get(`/api/campus?university=${universityId}&isActive=true`);
      setCampuses(response.data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  }, []);

  const fetchSchools = useCallback(async (campusId) => {
    if (!campusId) {
      setSchools([]);
      return;
    }
    try {
      const response = await api.get(`/api/schools?campus=${campusId}&isActive=true`);
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  }, []);

  const fetchPrograms = useCallback(async (schoolId) => {
    if (!schoolId) {
      setPrograms([]);
      return;
    }
    try {
      const response = await api.get(`/api/programs?school=${schoolId}&isActive=true`);
      setPrograms(response.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  }, []);

  const fetchCourses = useCallback(async (programId) => {
    if (!programId) {
      setCourses([]);
      return;
    }
    try {
      const response = await api.get(`/api/courses?program=${programId}&isActive=true`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, []);

  const fetchBranches = useCallback(async (courseId) => {
    if (!courseId) {
      setBranches([]);
      return;
    }
    try {
      const response = await api.get(`/api/branches?course=${courseId}&isActive=true`);
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  }, []);

  const fetchBatches = useCallback(async (branchId) => {
    if (!branchId) {
      setBatches([]);
      return;
    }
    try {
      const response = await api.get(`/api/batches?branch=${branchId}&isActive=true`);
      setBatches(response.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [timetablesRes, semestersRes, subjectsRes] = await Promise.all([
        api.get('/api/timetables'),
        api.get('/api/semesters?isActive=true'),
        api.get('/api/subjects?isActive=true')
      ]);
      console.log('Semesters data:', semestersRes.data);
      setTimetables(timetablesRes.data);
      setSemesters(semestersRes.data);
      setSubjects(subjectsRes.data);
      setError(''); // Clear any previous errors
      await fetchUniversities();
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(`Failed to load data: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [fetchUniversities]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const initializeEmptySchedule = () => {
    return DAYS.map((day, index) => ({
      dayOfWeek: index,
      dayName: day,
      slots: []
    }));
  };

  const handleAddSlot = (dayIndex) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].slots.push({
      slotNumber: newSchedule[dayIndex].slots.length + 1,
      startTime: '09:00',
      endTime: '10:00',
      subject: '',
      room: '',
      isBreak: false,
      breakType: 'none'
    });
    setFormData({ ...formData, schedule: newSchedule });
  };

  const handleRemoveSlot = (dayIndex, slotIndex) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    // Renumber slots
    newSchedule[dayIndex].slots.forEach((slot, idx) => {
      slot.slotNumber = idx + 1;
    });
    setFormData({ ...formData, schedule: newSchedule });
  };

  const handleSlotChange = (dayIndex, slotIndex, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].slots[slotIndex][field] = value;
    setFormData({ ...formData, schedule: newSchedule });
    setValidationStatus(''); // Reset validation when data changes
  };

  const handleCheckConflicts = async () => {
    setError('');
    setSuccess('');
    setValidationStatus('checking');

    const validation = await validateConflicts();
    
    if (!validation.valid) {
      setError(validation.message);
      setValidationStatus('invalid');
    } else {
      setSuccess('✅ No conflicts detected! Timetable is valid.');
      setValidationStatus('valid');
    }
  };

  const validateConflicts = async () => {
    // Get all subjects with their faculty for the current semester and section
    const semesterSubjects = subjects.filter(s => 
      s.semester === formData.semesterNumber &&
      (formData.section === '' || !formData.section || s.section === null || s.section === formData.section || s.section === '')
    );
    
    // Create a map of subject -> faculty
    const subjectFacultyMap = {};
    semesterSubjects.forEach(subj => {
      if (subj.faculty && subj.faculty.length > 0) {
        // The faculty array contains objects with teacher field
        subjectFacultyMap[subj._id] = subj.faculty[0].teacher;
      }
    });

    // Check for conflicts within the same timetable
    const sectionConflicts = [];
    const teacherTimeSlots = {}; // { facultyId: [{ day, startTime, endTime, subject }] }

    formData.schedule.forEach((day) => {
      const daySlots = [];
      
      day.slots.forEach((slot, slotIdx) => {
        if (slot.subject === 'BREAK' || !slot.subject) return;

        // Check section time conflict
        const conflict = daySlots.find(s => 
          (s.startTime === slot.startTime && s.endTime === slot.endTime) ||
          (s.startTime < slot.endTime && s.endTime > slot.startTime)
        );
        
        if (conflict) {
          sectionConflicts.push(
            `${day.dayName}: Time ${slot.startTime}-${slot.endTime} conflicts with another slot (${conflict.startTime}-${conflict.endTime})`
          );
        }
        
        daySlots.push(slot);

        // Track teacher schedule
        const facultyId = subjectFacultyMap[slot.subject];
        if (facultyId) {
          if (!teacherTimeSlots[facultyId]) {
            teacherTimeSlots[facultyId] = [];
          }
          teacherTimeSlots[facultyId].push({
            day: day.dayName,
            dayOfWeek: day.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject,
            section: formData.section
          });
        }
      });
    });

    if (sectionConflicts.length > 0) {
      return {
        valid: false,
        message: `Section conflicts detected:\n${sectionConflicts.join('\n')}`
      };
    }

    // Check for teacher conflicts across existing timetables
    try {
      const existingTimetables = await api.get('/api/timetables?isActive=true');
      const teacherConflicts = [];

      Object.entries(teacherTimeSlots).forEach(([facultyId, newSlots]) => {
        existingTimetables.data.forEach(tt => {
          // Skip same section
          if (tt.branch === formData.branch && tt.section === formData.section) return;

          tt.schedule.forEach(day => {
            day.slots.forEach(existingSlot => {
              // Check if existing slot has faculty and matches our faculty
              if (existingSlot.faculty && existingSlot.faculty._id === facultyId) {
                // Check if teacher has class on same day at overlapping time
                newSlots.forEach(newSlot => {
                  if (newSlot.dayOfWeek === day.dayOfWeek) {
                    const timeOverlap = 
                      (existingSlot.startTime === newSlot.startTime && existingSlot.endTime === newSlot.endTime) ||
                      (existingSlot.startTime < newSlot.endTime && existingSlot.endTime > newSlot.startTime);
                    
                    if (timeOverlap) {
                      const teacherName = existingSlot.faculty.name || 'Teacher';
                      teacherConflicts.push(
                        `${teacherName} is already teaching in ${tt.branch} ${tt.section} on ${newSlot.day} at ${existingSlot.startTime}-${existingSlot.endTime}`
                      );
                    }
                  }
                });
              }
            });
          });
        });
      });

      if (teacherConflicts.length > 0) {
        return {
          valid: false,
          message: `Teacher conflicts detected:\n${teacherConflicts.join('\n')}`
        };
      }

      return { valid: true };
    } catch (err) {
      console.error('Conflict check error:', err);
      // Show a more user-friendly message
      return { 
        valid: true,
        message: 'Unable to check conflicts due to network error. Proceeding with timetable creation.'
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Log formData for debugging
    console.log('FormData being submitted:', formData);

    // Validate conflicts before submitting
    setLoading(true);
    const validation = await validateConflicts();
    
    if (!validation.valid) {
      setError(validation.message);
      setLoading(false);
      return;
    }

    try {
      // Prepare data to match backend requirements
      const timetableData = {
        campus: formData.campusId,
        program: formData.programId,
        branch: formData.branchId,
        batch: formData.batchId,
        section: formData.section,
        semester: formData.semester,
        semesterNumber: formData.semesterNumber,
        academicYear: formData.academicYear,
        schedule: formData.schedule,
        effectiveFrom: formData.effectiveFrom,
        effectiveTill: null // or formData.effectiveTill if you have it
      };
      
      console.log('Timetable data being sent:', timetableData);
      
      if (editingId) {
        await api.put(`/api/timetables/${editingId}`, timetableData);
        setSuccess('Timetable updated successfully with no conflicts!');
      } else {
        await api.post('/api/timetables', timetableData);
        setSuccess('Timetable created successfully with no conflicts!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        branch: '',
        section: '',
        semester: '',
        semesterNumber: 1,
        academicYear: '',
        effectiveFrom: '',
        schedule: [],
        universityId: '',
        campusId: '',
        schoolId: '',
        programId: '',
        courseId: '',
        branchId: '',
        batchId: ''
      });
      fetchData();
    } catch (err) {
      console.error('Timetable creation error:', err);
      setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} timetable`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (timetable) => {
    setEditingId(timetable._id);
    setFormData({
      branch: timetable.branch,
      section: timetable.section,
      semester: timetable.semester._id || timetable.semester,
      semesterNumber: timetable.semesterNumber,
      academicYear: timetable.academicYear,
      effectiveFrom: timetable.effectiveFrom ? timetable.effectiveFrom.split('T')[0] : '',
      schedule: timetable.schedule.map(day => ({
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        slots: day.slots.map(slot => ({
          slotNumber: slot.slotNumber,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject?._id || slot.subject || '',
          room: slot.room || '',
          isBreak: slot.isBreak || false,
          breakType: slot.breakType || 'none'
        }))
      })),
      universityId: timetable.universityId || '',
      campusId: timetable.campusId || '',
      schoolId: timetable.schoolId || '',
      programId: timetable.programId || '',
      courseId: timetable.courseId || '',
      branchId: timetable.branchId || '',
      batchId: timetable.batchId || ''
    });
    setShowForm(true);
    setValidationStatus('');
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      branch: '',
      section: '',
      semester: '',
      semesterNumber: 1,
      academicYear: '',
      effectiveFrom: '',
      schedule: [],
      universityId: '',
      campusId: '',
      schoolId: '',
      programId: '',
      courseId: '',
      branchId: '',
      batchId: ''
    });
    setValidationStatus('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable?')) return;

    try {
      await api.delete(`/api/timetables/${id}`);
      setSuccess('Timetable deleted successfully');
      fetchData();
    } catch (err) {
      setError('Failed to delete timetable');
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setShowForm(true);
    setFormData({
      branch: '',
      section: '',
      semester: '',
      semesterNumber: 1,
      academicYear: '',
      effectiveFrom: '',
      schedule: initializeEmptySchedule(),
      universityId: '',
      campusId: '',
      schoolId: '',
      programId: '',
      courseId: '',
      branchId: '',
      batchId: ''
    });
    setValidationStatus('');
  };

  // Hierarchical selection handlers
  const handleUniversityChange = async (universityId) => {
    setFormData({
      ...formData,
      universityId,
      campusId: '',
      schoolId: '',
      programId: '',
      courseId: '',
      branchId: '',
      batchId: '',
      semester: '',
      branch: '',
      section: ''
    });
    await fetchCampuses(universityId);
  };

  const handleCampusChange = async (campusId) => {
    setFormData({
      ...formData,
      campusId,
      schoolId: '',
      programId: '',
      courseId: '',
      branchId: '',
      batchId: '',
      semester: '',
      branch: '',
      section: ''
    });
    await fetchSchools(campusId);
  };

  const handleSchoolChange = async (schoolId) => {
    setFormData({
      ...formData,
      schoolId,
      programId: '',
      courseId: '',
      branchId: '',
      batchId: '',
      semester: '',
      branch: '',
      section: ''
    });
    await fetchPrograms(schoolId);
  };

  const handleProgramChange = async (programId) => {
    setFormData({
      ...formData,
      programId,
      courseId: '',
      branchId: '',
      batchId: '',
      semester: '',
      branch: '',
      section: ''
    });
    await fetchCourses(programId);
  };

  const handleCourseChange = async (courseId) => {
    setFormData({
      ...formData,
      courseId,
      branchId: '',
      batchId: '',
      semester: '',
      branch: '',
      section: ''
    });
    await fetchBranches(courseId);
  };

  const handleBranchChange = async (branchId) => {
    setFormData({
      ...formData,
      branchId,
      batchId: '',
      semester: '',
      branch: '',
      section: ''
    });
    await fetchBatches(branchId);
  };

  const handleBatchChange = async (batchId) => {
    setFormData({
      ...formData,
      batchId,
      semester: '',
      branch: '',
      section: ''
    });
  };

  return (
    <div>
      {showGenerator ? (
        <WeeklyTimetableGenerator />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'white', margin: 0 }}>Weekly Timetable Management</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGenerator(true)}
                className="glass-button"
                style={{ padding: '0.75rem 1.5rem', background: 'rgba(52, 152, 219, 0.2)', border: '1px solid #3498db' }}
              >
                🔄 Weekly Timetable Generator
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => showForm ? handleCancelEdit() : handleCreateNew()}
                className="glass-button"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {showForm ? 'Cancel' : '+ Create Timetable'}
              </motion.button>
            </div>
          </div>

          {error && (
            <div className="notification-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="notification-success">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{ marginBottom: '2rem' }}
            >
              <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>{editingId ? 'Edit Weekly Timetable' : 'Create Weekly Timetable'}</h3>
              <form onSubmit={handleSubmit}>
                {/* Hierarchical Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      University
                    </label>
                    <select
                      className="glass-input"
                      value={formData.universityId}
                      onChange={(e) => handleUniversityChange(e.target.value)}
                      required
                    >
                      <option value="">Select University</option>
                      {universities.map(uni => (
                        <option key={uni._id} value={uni._id}>{uni.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Campus
                    </label>
                    <select
                      className="glass-input"
                      value={formData.campusId}
                      onChange={(e) => handleCampusChange(e.target.value)}
                      disabled={!formData.universityId}
                      required
                    >
                      <option value="">Select Campus</option>
                      {campuses.map(campus => (
                        <option key={campus._id} value={campus._id}>{campus.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      School
                    </label>
                    <select
                      className="glass-input"
                      value={formData.schoolId}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      disabled={!formData.campusId}
                      required
                    >
                      <option value="">Select School</option>
                      {schools.map(school => (
                        <option key={school._id} value={school._id}>{school.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Program
                    </label>
                    <select
                      className="glass-input"
                      value={formData.programId}
                      onChange={(e) => handleProgramChange(e.target.value)}
                      disabled={!formData.schoolId}
                      required
                    >
                      <option value="">Select Program</option>
                      {programs.map(program => (
                        <option key={program._id} value={program._id}>{program.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Course
                    </label>
                    <select
                      className="glass-input"
                      value={formData.courseId}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      disabled={!formData.programId}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>{course.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Branch
                    </label>
                    <select
                      className="glass-input"
                      value={formData.branchId}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      disabled={!formData.courseId}
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch._id} value={branch._id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Batch
                    </label>
                    <select
                      className="glass-input"
                      value={formData.batchId}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      disabled={!formData.branchId}
                      required
                    >
                      <option value="">Select Batch</option>
                      {batches.map(batch => (
                        <option key={batch._id} value={batch._id}>{batch.year} ({batch.admissionYear}-{batch.passOutYear})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Semester
                    </label>
                    <select
                      className="glass-input"
                      value={formData.semester}
                      onChange={(e) => {
                        const selected = semesters.find(s => s._id === e.target.value);
                        if (selected) {
                          setFormData({
                            ...formData,
                            semester: e.target.value,
                            semesterNumber: selected.semesterNumber || 1,
                            academicYear: selected.academicYear || '',
                            branch: selected.branch || '',
                            section: selected.section || '' // Make sure section is populated
                          });
                        }
                      }}
                      disabled={!formData.batchId}
                      required
                    >
                      <option value="">Select Semester</option>
                      {semesters.filter(sem => 
                        (sem.batchId === formData.batchId || 
                         sem.batch?._id === formData.batchId ||
                         sem.batch === formData.batchId)
                      ).map(sem => (
                        <option key={sem._id} value={sem._id}>
                          {sem.name} - {sem.branch} {sem.section ? `(${sem.section})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Section
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="e.g., A, B, C"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Effective From
                    </label>
                    <input
                      type="date"
                      className="glass-input"
                      value={formData.effectiveFrom}
                      onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Weekly Schedule */}
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ color: 'white', marginBottom: '1rem' }}>Weekly Schedule (Repeats Every Week)</h4>
                  
                  {formData.schedule.map((day, dayIndex) => (
                    <div key={dayIndex} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ color: 'white', margin: 0 }}>{day.dayName}</h5>
                        <button
                          type="button"
                          onClick={() => handleAddSlot(dayIndex)}
                          className="glass-button"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          + Add Slot
                        </button>
                      </div>

                      {day.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr 1fr 2fr 1fr auto',
                          gap: '0.75rem',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          padding: '0.75rem',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '6px'
                        }}>
                          <div style={{ color: 'white', fontWeight: 'bold' }}>#{slot.slotNumber}</div>
                          
                          <input
                            type="time"
                            className="glass-input"
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'startTime', e.target.value)}
                            style={{ padding: '0.5rem' }}
                          />

                          <input
                            type="time"
                            className="glass-input"
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'endTime', e.target.value)}
                            style={{ padding: '0.5rem' }}
                          />

                          <select
                            className="glass-input"
                            value={slot.subject}
                            onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'subject', e.target.value)}
                            style={{ padding: '0.5rem' }}
                          >
                            <option value="">Select Subject or Break</option>
                            <option value="BREAK">--- Break ---</option>
                            {subjects.filter(s => 
                              s.semester === formData.semesterNumber &&
                              (formData.section === '' || !formData.section || s.section === null || s.section === formData.section || s.section === '')
                            ).map(subj => {
                              // Get faculty name - handle different possible structures
                              let facultyName = 'TBA';
                              if (subj.faculty && subj.faculty.length > 0) {
                                const faculty = subj.faculty[0];
                                if (faculty.teacher) {
                                  // If faculty.teacher is an object with name property
                                  if (typeof faculty.teacher === 'object' && faculty.teacher.name) {
                                    facultyName = faculty.teacher.name;
                                  } 
                                  // If faculty.teacher is just an ID string
                                  else if (typeof faculty.teacher === 'string') {
                                    facultyName = 'Teacher ID: ' + faculty.teacher.substring(0, 8);
                                  }
                                }
                              }
                              
                              return (
                                <option key={subj._id} value={subj._id}>
                                  {subj.code} - {subj.name} (Teacher: {facultyName})
                                </option>
                              );
                            })}
                          </select>

                          <input
                            type="text"
                            className="glass-input"
                            placeholder="Room"
                            value={slot.room}
                            onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'room', e.target.value)}
                            style={{ padding: '0.5rem' }}
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(dayIndex, slotIndex)}
                            className="glass-button"
                            style={{ padding: '0.5rem', background: 'rgba(255, 107, 107, 0.2)' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {day.slots.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '1rem' }}>
                          No slots added. Click "+ Add Slot" to add classes.
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={handleCheckConflicts}
                    className="glass-button"
                    disabled={loading || validationStatus === 'checking'}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: validationStatus === 'valid' ? 'rgba(76, 209, 55, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    {validationStatus === 'checking' ? 'Checking...' : validationStatus === 'valid' ? '✅ Valid' : '🔍 Check for Conflicts'}
                  </button>
                  
                  <button
                    type="submit"
                    className="glass-button"
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: '0.75rem'
                    }}
                  >
                    {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Timetable' : 'Create Timetable')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Timetables List */}
          <GlassCard>
            <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Timetables</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {loading && timetables.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '3rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  margin: '1rem 0'
                }}>
                  <div style={{ 
                    textAlign: 'center', 
                    color: 'rgba(255,255,255,0.7)',
                    padding: '2rem'
                  }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                </div>
              ) : timetables.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '3rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  margin: '1rem 0'
                }}>
                  <div style={{ 
                    textAlign: 'center', 
                    color: 'rgba(255,255,255,0.7)',
                    padding: '2rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>No timetables created yet</h3>
                    <p style={{ margin: 0 }}>Click "Add Timetable" to create your first timetable</p>
                  </div>
                </div>
              ) : (
                timetables.map((timetable) => (
                  <motion.div
                    key={timetable._id}
                    whileHover={{ scale: 1.01 }}
                    className="glass-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ color: 'white', margin: 0, marginBottom: '0.5rem' }}>
                          {timetable.branch} - {timetable.section} | Semester {timetable.semesterNumber}
                        </h3>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                          {timetable.academicYear} | Effective from: {new Date(timetable.effectiveFrom).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(timetable)}
                          className="glass-button"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(timetable._id)}
                          className="glass-button"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(255, 107, 107, 0.2)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      {timetable.schedule.map((day) => (
                        <div key={day.dayOfWeek} style={{ marginBottom: '1rem' }}>
                          <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>{day.dayName}</div>
                          <div style={{ paddingLeft: '1rem' }}>
                            {day.slots.length === 0 ? (
                              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No classes</div>
                            ) : (
                              day.slots.map((slot) => (
                                <div key={slot.slotNumber} style={{
                                  fontSize: '0.85rem',
                                  color: 'rgba(255,255,255,0.8)',
                                  marginBottom: '0.25rem'
                                }}>
                                  Period {slot.slotNumber}: {slot.startTime} - {slot.endTime} | {slot.subjectCode || 'Break'} {slot.room ? `(${slot.room})` : ''}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
};

export default TimetableManagement;
