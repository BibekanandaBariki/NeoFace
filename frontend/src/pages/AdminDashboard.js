import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import GlassCard from '../components/GlassCard';
import AttendanceCharts from '../components/AttendanceCharts';
import HeatmapCalendar from '../components/HeatmapCalendar';
import FaceRecognitionCapture from '../components/FaceRecognitionCapture';
import TeacherTimetableView from '../components/TeacherTimetableView';
import '../styles/glassmorphism.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    pendingApprovals: 0
  });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    universityId: '',
    department: '',
    section: '',
    semester: '',
    year: new Date().getFullYear()
  });
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    department: '',
    semester: '',
    credits: 3
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, subjectsRes, attendanceRes, analyticsRes] = await Promise.all([
        api.get('/students'),
        api.get('/subjects'),
        api.get('/attendance'),
        api.get('/analytics/overview')
      ]);

      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
      setAttendance(attendanceRes.data);
      setAnalytics(analyticsRes.data);
      setStats({
        totalStudents: studentsRes.data.length,
        totalSubjects: subjectsRes.data.length,
        pendingApprovals: studentsRes.data.filter(s => s.registrationStatus === 'pending').length
      });
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleApprove = async (studentId) => {
    try {
      await api.post(`/face/approve/${studentId}`);
      fetchData();
    } catch (error) {
      alert('Failed to approve registration');
    }
  };

  const handleReject = async (studentId) => {
    try {
      await api.post(`/face/reject/${studentId}`);
      fetchData();
    } catch (error) {
      alert('Failed to reject registration');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', newStudent);
      const loginInfo = `Student created successfully!

Login Credentials:
Email: ${newStudent.email}
Password: ${newStudent.universityId}

(Student should use University ID as password)`;
      alert(loginInfo);
      setShowAddStudent(false);
      setNewStudent({
        name: '',
        email: '',
        universityId: '',
        department: '',
        section: '',
        semester: '',
        year: new Date().getFullYear()
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add student');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects', newSubject);
      setShowAddSubject(false);
      setNewSubject({
        code: '',
        name: '',
        department: '',
        semester: '',
        credits: 3
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add subject');
    }
  };

  const handleMarkAttendance = async (studentId, subjectId, date, status = 'present') => {
    try {
      await api.post('/attendance/manual', {
        studentId,
        subjectId,
        date,
        status
      });
      fetchData();
      alert('Attendance marked successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleAttendanceMarked = (newAttendanceRecord) => {
    setAttendance(prev => [newAttendanceRecord, ...prev]);
  };

  const tabs = ['overview', 'timetable', 'students', 'subjects', 'attendance', 'analytics'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}
        >
          <div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              Admin Dashboard
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Welcome, {user?.name}</p>
          </div>
          <button onClick={logout} className="glass-button glass-button-secondary">
            Logout
          </button>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="glass-button"
              style={{
                background: activeTab === tab
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                textTransform: 'capitalize'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <GlassCard>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Total Students</h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
              {stats.totalStudents}
            </p>
          </GlassCard>
          <GlassCard>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>My Subjects</h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
              {stats.totalSubjects}
            </p>
          </GlassCard>
          <GlassCard>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Pending Approvals</h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
              {stats.pendingApprovals}
            </p>
          </GlassCard>
        </div>

            {analytics && (
              <>
                <AttendanceCharts analytics={analytics} />
                <div style={{ marginTop: '2rem' }}>
                  <HeatmapCalendar dailyData={analytics.dailyHeatmap} />
                </div>
              </>
            )}
          </>
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <TeacherTimetableView />
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            <GlassCard style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: 'white', marginBottom: '1rem' }}>Manage Students</h2>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="glass-button"
                >
                  Add Student
                </button>
              </div>

              {showAddStudent && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    marginBottom: '1rem'
                  }}
                >
                  <h3 style={{ color: 'white', marginBottom: '1rem' }}>Create New Student</h3>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                      📝 Student Login Information:
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', margin: 0 }}>
                      After creation, student will login with:<br/>
                      <strong>Email:</strong> The email you enter below<br/>
                      <strong>Password:</strong> Their University ID (same as entered below)
                    </p>
                  </div>
                  <form onSubmit={handleAddStudent}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <input
                        className="glass-input"
                        placeholder="Name"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        type="email"
                        placeholder="Email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        placeholder="University ID"
                        value={newStudent.universityId}
                        onChange={(e) => setNewStudent({ ...newStudent, universityId: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        placeholder="Department"
                        value={newStudent.department}
                        onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        placeholder="Section (optional, e.g., A, B, CSE-A)"
                        value={newStudent.section}
                        onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                      />
                      <input
                        className="glass-input"
                        type="number"
                        placeholder="Semester"
                        min="1"
                        max="8"
                        value={newStudent.semester}
                        onChange={(e) => setNewStudent({ ...newStudent, semester: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        type="number"
                        placeholder="Year"
                        value={newStudent.year}
                        onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className="glass-button">
                        Add Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddStudent(false)}
                        className="glass-button glass-button-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {students.map(student => (
              <motion.div
                key={student._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ color: 'white', fontWeight: 'bold' }}>{student.name}</p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        {student.email} | {student.universityId}
                      </p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                        Status: {student.registrationStatus}
                  </p>
                </div>
                    {student.registrationStatus === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleApprove(student._id)}
                          className="glass-button"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(student._id)}
                          className="glass-button glass-button-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <>
            <GlassCard style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: 'white', marginBottom: '1rem' }}>My Subjects</h2>
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="glass-button"
                >
                  Add Subject
                </button>
              </div>

              {showAddSubject && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    marginBottom: '1rem'
                  }}
                >
                  <form onSubmit={handleAddSubject}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <input
                        className="glass-input"
                        placeholder="Subject Code"
                        value={newSubject.code}
                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        placeholder="Subject Name"
                        value={newSubject.name}
                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        placeholder="Department"
                        value={newSubject.department}
                        onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        type="number"
                        placeholder="Semester"
                        min="1"
                        max="8"
                        value={newSubject.semester}
                        onChange={(e) => setNewSubject({ ...newSubject, semester: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className="glass-button">
                        Add Subject
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddSubject(false)}
                        className="glass-button glass-button-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {subjects.map(subject => (
                  <motion.div
                    key={subject._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px'
                    }}
                  >
                    <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {subject.name} ({subject.code})
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                      {subject.department} | Semester {subject.semester} | {subject.students?.length || 0} students
                    </p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
          </>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            {/* Face Recognition Attendance */}
            <GlassCard style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Take Attendance - Face Recognition</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                  Select Subject
                </label>
                <select
                  className="glass-input"
                  value={selectedSubject || ''}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  style={{ width: '100%', marginBottom: '1rem' }}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code}) - {subject.students?.length || 0} students
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubject && (
                <div>
                  {(() => {
                    const subject = subjects.find(s => s._id === selectedSubject);
                    // Get enrolled students - properly check subject.students array
                    const enrolledStudents = students.filter(s => {
                      // Check if student ID is in subject's students array (handle both ObjectId and string)
                      if (subject?.students && subject.students.some(stdId => {
                        const studentIdStr = typeof stdId === 'object' ? (stdId._id || stdId).toString() : stdId.toString();
                        return studentIdStr === s._id.toString();
                      })) {
                        return true;
                      }
                      // Fallback: match by department and semester
                      if (subject?.department && subject?.semester) {
                        return s.department === subject.department && 
                               parseInt(s.semester) === parseInt(subject.semester);
                      }
                      return false;
                    });
                    const registeredStudents = enrolledStudents.filter(s => 
                      s.faceRegistered && s.registrationStatus === 'approved'
                    );
                    
                    return (
                      <>
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                          {subject?.timetable && subject.timetable.length > 0 ? (
                            <>Time Slots: {subject.timetable.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}</>
                          ) : (
                            'No timetable slots configured'
                          )}
                        </p>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                          Total Enrolled: {enrolledStudents.length} | Registered & Approved: {registeredStudents.length}
                        </p>
                        {registeredStudents.length === 0 ? (
                          <p style={{ color: '#f87171', padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '8px' }}>
                            No students have registered and been approved for this subject yet.
                          </p>
                        ) : (
                          <FaceRecognitionCapture
                            subjectId={selectedSubject}
                            onAttendanceMarked={handleAttendanceMarked}
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </GlassCard>

            {/* Manual Attendance Marking */}
            <GlassCard style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Manual Attendance Marking</h2>
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', margin: 0 }}>
                  <strong>Your Assigned Subjects:</strong> {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {subjects.length === 0 ? (
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '2rem' }}>
                    No subjects assigned. Create subjects in the Subjects tab or contact SuperAdmin.
                  </p>
                ) : (
                  subjects.map(subject => {
                    // Get students enrolled in this subject
                    const subjectStudents = students.filter(s => {
                      // Check if student is in subject's students array
                      if (subject.students && subject.students.some(stdId => 
                        (typeof stdId === 'object' ? stdId._id : stdId) === s._id
                      )) {
                        return true;
                      }
                      // Fallback: match by department and semester (for auto-assignment)
                      if (s.department === subject.department && parseInt(s.semester) === parseInt(subject.semester)) {
                        // Check section match if subject has a section
                        if (subject.section) {
                          return s.section === subject.section || !s.section;
                        }
                        return true;
                      }
                      return false;
                    });
                    
                    if (subjectStudents.length === 0) {
                      return (
                        <div key={subject._id} style={{ 
                          padding: '1rem', 
                          background: 'rgba(255, 255, 255, 0.03)', 
                          borderRadius: '10px',
                          marginBottom: '1rem'
                        }}>
                          <h3 style={{ color: 'white', fontSize: '1.1rem' }}>
                            {subject.name} ({subject.code})
                          </h3>
                          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
                            No students enrolled in this subject yet.
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={subject._id} style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <h3 style={{ color: 'white', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                            {subject.name} ({subject.code})
                          </h3>
                          {subject.timetable && subject.timetable.length > 0 && (
                            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                              Time Slots: {subject.timetable.map(s => `${s.day} ${s.startTime}-${s.endTime} ${s.room ? `(${s.room})` : ''}`).join(', ')}
                            </p>
                          )}
                        </div>
                        {subject.timetable && subject.timetable.length > 0 ? (
                          subject.timetable.map((slot, slotIndex) => (
                            <div key={slotIndex} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {slot.day} - {slot.startTime} to {slot.endTime} {slot.room && `(${slot.room})`}
                              </p>
                              <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {subjectStudents.map(student => (
                                  <motion.div
                                    key={student._id}
                                    style={{
                                      padding: '0.75rem',
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      borderRadius: '8px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <span style={{ color: 'white', fontSize: '0.9rem' }}>
                                      {student.name} ({student.universityId})
                                      {student.section && ` - Section ${student.section}`}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button
                                        onClick={() => handleMarkAttendance(student._id, subject._id, new Date().toISOString().split('T')[0], 'present')}
                                        className="glass-button"
                                        style={{ 
                                          padding: '0.5rem 1rem', 
                                          fontSize: '0.85rem', 
                                          background: 'rgba(74, 222, 128, 0.3)' 
                                        }}
                                      >
                                        Present
                                      </button>
                                      <button
                                        onClick={() => handleMarkAttendance(student._id, subject._id, new Date().toISOString().split('T')[0], 'absent')}
                                        className="glass-button"
                                        style={{ 
                                          padding: '0.5rem 1rem', 
                                          fontSize: '0.85rem', 
                                          background: 'rgba(248, 113, 113, 0.3)' 
                                        }}
                                      >
                                        Absent
                                      </button>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                              All Students (No time slots configured)
                            </p>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                              {subjectStudents.map(student => (
                                <motion.div
                                  key={student._id}
                                  style={{
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span style={{ color: 'white', fontSize: '0.9rem' }}>
                                    {student.name} ({student.universityId})
                                    {student.section && ` - Section ${student.section}`}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => handleMarkAttendance(student._id, subject._id, new Date().toISOString().split('T')[0], 'present')}
                                      className="glass-button"
                                      style={{ 
                                        padding: '0.5rem 1rem', 
                                        fontSize: '0.85rem', 
                                        background: 'rgba(74, 222, 128, 0.3)' 
                                      }}
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() => handleMarkAttendance(student._id, subject._id, new Date().toISOString().split('T')[0], 'absent')}
                                      className="glass-button"
                                      style={{ 
                                        padding: '0.5rem 1rem', 
                                        fontSize: '0.85rem', 
                                        background: 'rgba(248, 113, 113, 0.3)' 
                                      }}
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>

            {/* Attendance Records */}
            <GlassCard>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Attendance Records</h2>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {attendance.length === 0 ? (
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '2rem' }}>
                    No attendance records yet
                  </p>
                ) : (
                  attendance.map(record => (
                    <motion.div
                      key={record._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ color: 'white', fontWeight: 'bold' }}>
                            {record.studentId?.name || 'Unknown'}
                          </p>
                          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                            {record.subjectId?.name || 'Unknown'} | {new Date(record.date).toLocaleDateString()}
                          </p>
                          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                            Marked by: {record.markedBy || 'Unknown'}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          background: record.status === 'present' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)',
                          color: 'white',
                          fontSize: '0.85rem'
                        }}>
                          {record.status}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </GlassCard>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <>
            <GlassCard style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Analytics Overview</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                    Overall Attendance
                  </p>
                  <p style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {analytics.attendance?.toFixed(1)}%
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                    Total Classes
                  </p>
                  <p style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {analytics.totalClasses}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                    Present
                  </p>
                  <p style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {analytics.presentCount}
                  </p>
                </div>
              </div>
            </GlassCard>

            <AttendanceCharts analytics={analytics} />
            <div style={{ marginTop: '2rem' }}>
              <HeatmapCalendar dailyData={analytics.dailyHeatmap} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
