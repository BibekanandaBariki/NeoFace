import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/glassmorphism.css';

const AdminAttendanceMarking = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [timetable, setTimetable] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject && selectedDate) {
      fetchTimetableForDate();
    }
  }, [selectedSubject, selectedDate]);

  useEffect(() => {
    if (selectedSubject) {
      fetchStudentsForSubject();
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subjects?isActive=true');
      setSubjects(response.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError(`Failed to load subjects: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForSubject = async () => {
    try {
      const subject = subjects.find(s => s._id === selectedSubject);
      if (!subject) return;

      setLoading(true);
      const response = await api.get(`/api/students?department=${subject.department}&semester=${subject.semester}`);
      setStudents(response.data);
      
      // Initialize attendance data
      const initialData = response.data.map(student => ({
        studentId: student._id,
        student: student,
        status: 'absent',
        marked: false
      }));
      setAttendanceData(initialData);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to load students:', err);
      setError(`Failed to load students: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetableForDate = async () => {
    try {
      const subject = subjects.find(s => s._id === selectedSubject);
      if (!subject) return;

      setLoading(true);
      const response = await api.get(`/api/timetables/for-date/${selectedDate}`, {
        params: {
          branch: subject.branch || subject.department,
          section: subject.section || 'A'
        }
      });

      if (response.data && response.data.schedule) {
        setTimetable(response.data);
        // Filter slots for the selected subject
        const slots = response.data.schedule.slots.filter(
          slot => slot.subject?._id?.toString() === selectedSubject || slot.subject?.toString() === selectedSubject
        );
        setAvailableSlots(slots);
      }
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Timetable fetch error:', err);
      // Don't show error for timetable not found - it's expected when no timetable exists
      if (err.response?.status !== 404) {
        setError(`Failed to load timetable: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
      }
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = (studentId) => {
    setAttendanceData(attendanceData.map(item =>
      item.studentId === studentId
        ? { ...item, status: item.status === 'present' ? 'absent' : 'present' }
        : item
    ));
  };

  const handleMarkAll = (status) => {
    setAttendanceData(attendanceData.map(item => ({ ...item, status })));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setLoading(true);

      const attendanceRecords = attendanceData.map(item => ({
        studentId: item.studentId,
        status: item.status
      }));

      await api.post('/api/attendance/bulk-mark', {
        students: attendanceRecords,
        subjectId: selectedSubject,
        date: selectedDate,
        slotNumber: selectedSlot.slotNumber,
        classStartTime: selectedSlot.startTime,
        classEndTime: selectedSlot.endTime,
        defaultStatus: 'absent'
      });

      setSuccess(`Attendance marked successfully for ${attendanceRecords.length} students!`);
      
      // Mark all as marked
      setAttendanceData(attendanceData.map(item => ({ ...item, marked: true })));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAttendance = async (attendanceId, newStatus, reason) => {
    try {
      await api.put(`/api/attendance/${attendanceId}/edit`, {
        status: newStatus,
        reason: reason
      });
      setSuccess('Attendance updated successfully');
    } catch (err) {
      setError('Failed to update attendance');
    }
  };

  const presentCount = attendanceData.filter(a => a.status === 'present').length;
  const absentCount = attendanceData.filter(a => a.status === 'absent').length;

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Mark Attendance
      </h2>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255, 107, 107, 0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', background: 'rgba(76, 209, 55, 0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#4cd137' }}>
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
              Subject
            </label>
            <select
              className="glass-input"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
              Date
            </label>
            <input
              type="date"
              className="glass-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
              Time Slot
            </label>
            <select
              className="glass-input"
              value={selectedSlot ? JSON.stringify(selectedSlot) : ''}
              onChange={(e) => setSelectedSlot(e.target.value ? JSON.parse(e.target.value) : null)}
              disabled={availableSlots.length === 0}
            >
              <option value="">
                {availableSlots.length === 0 ? 'No slots available' : 'Select Time Slot'}
              </option>
              {availableSlots.map((slot, index) => (
                <option key={index} value={JSON.stringify(slot)}>
                  Period {slot.slotNumber}: {slot.startTime} - {slot.endTime}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedSubject && students.length > 0 && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>{students.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Total Students</div>
            </div>
            <div className="glass-card" style={{ textAlign: 'center', background: 'rgba(76, 209, 55, 0.1)' }}>
              <div style={{ color: '#4cd137', fontSize: '2rem', fontWeight: 'bold' }}>{presentCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Present</div>
            </div>
            <div className="glass-card" style={{ textAlign: 'center', background: 'rgba(255, 107, 107, 0.1)' }}>
              <div style={{ color: '#ff6b6b', fontSize: '2rem', fontWeight: 'bold' }}>{absentCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Absent</div>
            </div>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Attendance</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMarkAll('present')}
              className="glass-button"
              style={{ padding: '0.75rem 1.5rem', background: 'rgba(76, 209, 55, 0.2)' }}
            >
              Mark All Present
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMarkAll('absent')}
              className="glass-button"
              style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 107, 107, 0.2)' }}
            >
              Mark All Absent
            </motion.button>
          </div>

          {/* Students List */}
          <div className="glass-card">
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {attendanceData.map((item, index) => (
                <motion.div
                  key={item.studentId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderBottom: index < attendanceData.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: '500' }}>{item.student.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      {item.student.universityId || item.student.email}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleAttendance(item.studentId)}
                    disabled={item.marked}
                    style={{
                      padding: '0.5rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: item.marked ? 'not-allowed' : 'pointer',
                      background: item.status === 'present' 
                        ? 'rgba(76, 209, 55, 0.3)' 
                        : 'rgba(255, 107, 107, 0.3)',
                      color: 'white',
                      fontWeight: 'bold',
                      opacity: item.marked ? 0.6 : 1
                    }}
                  >
                    {item.status === 'present' ? '✓ Present' : '✗ Absent'}
                  </motion.button>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitAttendance}
                disabled={loading || !selectedSlot}
                className="glass-button"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  opacity: loading || !selectedSlot ? 0.6 : 1,
                  cursor: loading || !selectedSlot ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </motion.button>
            </div>
          </div>
        </>
      )}

      {selectedSubject && students.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
          No students found for this subject
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceMarking;
