import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import '../styles/glassmorphism.css';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const EnhancedTimetableManagement = () => {
  const [timetables, setTimetables] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Slot creation form
  const [slotForm, setSlotForm] = useState({
    branch: '',
    section: '',
    semester: '',
    dayOfWeek: 1,
    dayName: 'Monday',
    slotNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: '',
    room: ''
  });

  const [currentTimetable, setCurrentTimetable] = useState(null);
  const [viewMode, setViewMode] = useState('create'); // create or view

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (slotForm.branch && slotForm.section && slotForm.semester) {
      // Filter subjects for selected branch, section, and semester
      const semesterObj = semesters.find(s => s._id === slotForm.semester);
      if (semesterObj) {
        const filtered = subjects.filter(subj => 
          subj.department === slotForm.branch &&
          subj.semester === semesterObj.semesterNumber &&
          (subj.section === slotForm.section || subj.section === null || subj.section === '')
        );
        setFilteredSubjects(filtered);
      }
    }
  }, [slotForm.branch, slotForm.section, slotForm.semester, subjects, semesters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetablesRes, semestersRes, subjectsRes] = await Promise.all([
        api.get('/timetables'),
        api.get('/semesters?isActive=true'),
        api.get('/subjects')
      ]);
      setTimetables(timetablesRes.data);
      setSemesters(semestersRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const response = await api.post('/timetables/add-slot', slotForm);
      setSuccess('Time slot added successfully!');
      setCurrentTimetable(response.data.timetable);
      
      // Reset form for next slot
      setSlotForm({
        ...slotForm,
        slotNumber: slotForm.slotNumber + 1,
        subjectId: '',
        room: ''
      });
      
      fetchData();
    } catch (err) {
      if (err.response?.data?.conflict) {
        const conflict = err.response.data.conflict;
        if (conflict.type === 'section_conflict') {
          setError(err.response.data.message);
        } else if (conflict.type === 'teacher_conflict') {
          setError(err.response.data.message);
        }
      } else {
        setError(err.response?.data?.message || 'Failed to add time slot');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable?')) return;

    try {
      await api.delete(`/timetables/${id}`);
      setSuccess('Timetable deleted successfully');
      fetchData();
    } catch (err) {
      setError('Failed to delete timetable');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>Timetable Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setViewMode('create')}
            className="glass-button"
            style={{ background: viewMode === 'create' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
          >
            Create Slots
          </button>
          <button
            onClick={() => setViewMode('view')}
            className="glass-button"
            style={{ background: viewMode === 'view' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
          >
            View All
          </button>
        </div>
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
            border: '1px solid rgba(255, 107, 107, 0.4)'
          }}
        >
          <strong>⚠️ Conflict Detected:</strong><br />
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '1rem',
            background: 'rgba(76, 209, 55, 0.2)',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#4cd137'
          }}
        >
          {success}
        </motion.div>
      )}

      {/* Create Mode */}
      {viewMode === 'create' && (
        <div className="glass-card">
          <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Add Time Slot</h3>
          
          <form onSubmit={handleAddSlot}>
            {/* Step 1: Select Semester */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                1. Select Semester & Section
              </label>
              <select
                className="glass-input"
                value={slotForm.semester}
                onChange={(e) => {
                  const semesterId = e.target.value;
                  setSlotForm({
                    ...slotForm,
                    semester: semesterId,
                    // Reset dependent fields
                    subjectId: '',
                    branch: '',
                    section: ''
                  });
                  
                  // Find the selected semester to get branch and section info
                  const selectedSemester = semesters.find(sem => sem._id === semesterId);
                  if (selectedSemester) {
                    setSlotForm(prev => ({
                      ...prev,
                      branch: selectedSemester.branch || '',
                      section: selectedSemester.section || ''
                    }));
                  }
                }}
                required
              >
                <option value="">Choose Semester & Section</option>
                {semesters.map(sem => (
                  <option key={sem._id} value={sem._id}>
                    {sem.name} - {sem.branch} {sem.section ? `Section ${sem.section}` : 'All Sections'}
                  </option>
                ))}
              </select>
            </div>

            {slotForm.semester && (
              <>
                {/* Step 2: Select Day and Time */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      2. Day of Week
                    </label>
                    <select
                      className="glass-input"
                      value={slotForm.dayOfWeek}
                      onChange={(e) => {
                        const day = DAYS.find(d => d.value === parseInt(e.target.value));
                        setSlotForm({
                          ...slotForm,
                          dayOfWeek: parseInt(e.target.value),
                          dayName: day.label
                        });
                      }}
                      required
                    >
                      {DAYS.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Slot Number
                    </label>
                    <input
                      type="number"
                      className="glass-input"
                      min="1"
                      value={slotForm.slotNumber}
                      onChange={(e) => setSlotForm({ ...slotForm, slotNumber: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      className="glass-input"
                      value={slotForm.startTime}
                      onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      className="glass-input"
                      value={slotForm.endTime}
                      onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Step 3: Select Subject (shows only subjects for this branch/section) */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                    3. Select Subject (Teacher will be auto-assigned)
                  </label>
                  <select
                    className="glass-input"
                    value={slotForm.subjectId}
                    onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
                    required
                  >
                    <option value="">Choose Subject</option>
                    {filteredSubjects.length === 0 ? (
                      <option disabled>No subjects found for this section</option>
                    ) : (
                      filteredSubjects.map(subj => (
                        <option key={subj._id} value={subj._id}>
                          {subj.code} - {subj.name} (Teacher: {subj.faculty?.name || 'Not assigned'})
                        </option>
                      ))
                    )}
                  </select>
                  {filteredSubjects.length === 0 && slotForm.semester && (
                    <div style={{ color: 'rgba(255, 107, 107, 0.8)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      ⚠️ Please create subjects for {slotForm.branch} Section {slotForm.section} first
                    </div>
                  )}
                </div>

                {/* Step 4: Room */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                    4. Room (Optional)
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g., Room 101, Lab A"
                    value={slotForm.room}
                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="glass-button"
                  disabled={loading || filteredSubjects.length === 0}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    opacity: loading || filteredSubjects.length === 0 ? 0.6 : 1
                  }}
                >
                  {loading ? 'Checking Conflicts...' : 'Add Time Slot'}
                </button>
              </>
            )}
          </form>

          {/* Current Timetable Preview */}
          {currentTimetable && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(76, 209, 55, 0.1)', borderRadius: '8px' }}>
              <h4 style={{ color: 'white', marginBottom: '1rem' }}>
                Current Timetable for {currentTimetable.branch} - Section {currentTimetable.section}
              </h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {currentTimetable.schedule.map(day => (
                  <div key={day.dayOfWeek} style={{ marginBottom: '1rem' }}>
                    {day.slots.length > 0 && (
                      <>
                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          {day.dayName}
                        </div>
                        <div style={{ paddingLeft: '1rem' }}>
                          {day.slots.map((slot, idx) => (
                            <div key={idx} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                              Period {slot.slotNumber}: {slot.startTime} - {slot.endTime} | {slot.subjectCode} {slot.room && `(${slot.room})`}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode */}
      {viewMode === 'view' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {loading && timetables.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>
              Loading timetables...
            </div>
          ) : timetables.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>
              No timetables created yet. Switch to "Create Slots" to add time slots.
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
                      {timetable.branch} - Section {timetable.section} | Semester {timetable.semesterNumber}
                    </h3>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                      {timetable.academicYear}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTimetable(timetable._id)}
                    className="glass-button"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(255, 107, 107, 0.2)' }}
                  >
                    Delete
                  </button>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  {timetable.schedule.map((day) => (
                    day.slots.length > 0 && (
                      <div key={day.dayOfWeek} style={{ marginBottom: '1rem' }}>
                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>{day.dayName}</div>
                        <div style={{ paddingLeft: '1rem' }}>
                          {day.slots.map((slot) => (
                            <div key={slot.slotNumber} style={{
                              fontSize: '0.85rem',
                              color: 'rgba(255,255,255,0.8)',
                              marginBottom: '0.25rem'
                            }}>
                              Period {slot.slotNumber}: {slot.startTime} - {slot.endTime} | {slot.subjectCode || 'Break'} 
                              {slot.facultyName && ` - ${slot.facultyName}`} 
                              {slot.room && ` (${slot.room})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedTimetableManagement;
