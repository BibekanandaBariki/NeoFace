import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
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
    schedule: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationStatus, setValidationStatus] = useState(''); // 'checking', 'valid', 'invalid'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetablesRes, semestersRes, subjectsRes] = await Promise.all([
        api.get('/api/timetables'),
        api.get('/api/semesters?isActive=true'),
        api.get('/api/subjects?isActive=true')
      ]);
      setTimetables(timetablesRes.data);
      setSemesters(semestersRes.data);
      setSubjects(subjectsRes.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(`Failed to load data: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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

    // Validate conflicts before submitting
    setLoading(true);
    const validation = await validateConflicts();
    
    if (!validation.valid) {
      setError(validation.message);
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/timetables/${editingId}`, formData);
        setSuccess('Timetable updated successfully with no conflicts!');
      } else {
        await api.post('/api/timetables', formData);
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
        schedule: []
      });
      fetchData();
    } catch (err) {
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
      }))
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
      schedule: []
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
      schedule: initializeEmptySchedule()
    });
    setValidationStatus('');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>Weekly Timetable Management</h2>
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

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '1rem',
            background: 'rgba(255, 107, 107, 0.2)',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#ff6b6b',
            border: '1px solid rgba(255, 107, 107, 0.4)',
            whiteSpace: 'pre-line'
          }}
        >
          <strong>⚠️ Conflict Detected:</strong><br />
          {error}
        </motion.div>
      )}

      {success && (
        <div style={{ padding: '1rem', background: 'rgba(76, 209, 55, 0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#4cd137' }}>
          {success}
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
                        section: selected.section || ''
                      });
                    }
                  }}
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(sem => (
                    <option key={sem._id} value={sem._id}>
                      {sem.name} - {sem.branch} {sem.section ? `(${sem.section})` : ''}
                    </option>
                  ))}
                </select>
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
                        ).map(subj => (
                          <option key={subj._id} value={subj._id}>
                            {subj.code} - {subj.name} (Teacher: {subj.faculty && subj.faculty.length > 0 ? (subj.faculty[0].teacher?.name || 'Unknown') : 'TBA'})
                          </option>
                        ))}
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
      <div style={{ display: 'grid', gap: '1rem' }}>
        {loading && timetables.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>
            Loading timetables...
          </div>
        ) : timetables.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>
            No timetables found. Create one to get started!
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
    </div>
  );
};

export default TimetableManagement;
