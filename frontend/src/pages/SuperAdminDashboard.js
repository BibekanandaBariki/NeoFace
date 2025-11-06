import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import GlassCard from '../components/GlassCard';
import Analytics3D from '../components/Analytics3D';
import AttendanceCharts from '../components/AttendanceCharts';
import HeatmapCalendar from '../components/HeatmapCalendar';
import FaceRecognitionCapture from '../components/FaceRecognitionCapture';
import WebcamCapture from '../components/WebcamCapture';
import SemesterManagement from '../components/SemesterManagement';
import TimetableManagement from '../components/TimetableManagement';
import AdminAttendanceMarking from '../components/AdminAttendanceMarking';
import CampusManagement from '../components/CampusManagement';
import ProgramManagement from '../components/ProgramManagement';
import BranchManagement from '../components/BranchManagement';
import BatchManagement from '../components/BatchManagement';
import UniversityManagement from '../components/UniversityManagement';
import SchoolManagement from '../components/SchoolManagement';
import CourseManagement from '../components/CourseManagement';
import AdmitCardGeneration from '../components/AdmitCardGeneration';
import SuperAdminOverride from '../components/SuperAdminOverride';
import SubjectManagement from '../components/SubjectManagement';
import '../styles/glassmorphism.css';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    totalSubjects: 0,
    pendingRegistrations: 0,
    totalAttendance: 0
  });
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [selectedStudentForFace, setSelectedStudentForFace] = useState(null);

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    department: ''
  });
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
    section: '',
    semester: '',
    credits: 3,
    faculty: '',
    timetable: []
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showFaceUpdateModal, setShowFaceUpdateModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editUserData, setEditUserData] = useState({});
  const [editStudentData, setEditStudentData] = useState({});
  const [timetableSlot, setTimetableSlot] = useState({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: ''
  });

  const handleAttendanceMarked = (newAttendance) => {
    setAttendance(prev => [...prev, newAttendance]);
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, usersRes, subjectsRes, analyticsRes, attendanceRes, timetableRes] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/users'),
        api.get('/api/subjects'),
        api.get('/api/analytics/overview'),
        api.get('/api/attendance'),
        api.get('/api/timetables')
      ]);

      const studentsData = studentsRes.data;
      const usersData = usersRes.data;
      const adminsData = usersData.filter(u => u.role === 'admin');

      setStats({
        totalStudents: studentsData.length,
        totalAdmins: adminsData.length,
        totalSubjects: subjectsRes.data.length,
        pendingRegistrations: studentsData.filter(s => s.registrationStatus === 'pending').length,
        totalAttendance: analyticsRes.data?.attendance || 0
      });

      setStudents(studentsData);
      setAdmins(adminsData);
      setSubjects(subjectsRes.data);
      setAttendance(attendanceRes.data);
      setTimetable(timetableRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/users', {
        ...newAdmin,
        role: 'admin'
      });
      setShowAddAdmin(false);
      setNewAdmin({ name: '', email: '', password: '', department: '' });
      fetchDashboardData();
      alert('Admin created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to create admin');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!newStudent.name || !newStudent.email || !newStudent.universityId || 
          !newStudent.department || !newStudent.semester) {
        alert('Please fill in all required fields: Name, Email, University ID, Department, and Semester');
        return;
      }

      // Ensure semester and year are numbers
      const semesterNum = parseInt(newStudent.semester, 10);
      const yearNum = parseInt(newStudent.year, 10) || new Date().getFullYear();

      if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
        alert('Semester must be a number between 1 and 8');
        return;
      }

      const studentData = {
        name: newStudent.name.trim(),
        email: newStudent.email.trim(),
        universityId: newStudent.universityId.trim(),
        department: newStudent.department.trim(),
        section: newStudent.section ? newStudent.section.trim() : '',
        semester: semesterNum,
        year: yearNum
      };

      console.log('Creating student with data:', studentData);
      
      const response = await api.post('/api/students', studentData);
      
      console.log('Student created successfully:', response.data);
      
      const loginInfo = `Student created successfully!

Login Credentials:
Email: ${studentData.email}
Password: ${studentData.universityId}

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
      fetchDashboardData();
    } catch (error) {
      console.error('Create student error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to create student. Please check all fields.';
      
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.map(e => e.msg || e.message).join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      if (!newSubject.faculty) {
        alert('Please select a faculty/admin for this subject');
        return;
      }
      
      // First create subject
      const subjectRes = await api.post('/api/subjects', {
        ...newSubject
      });
      
      // If timetable slots exist, update timetable
      if (newSubject.timetable.length > 0) {
        await api.put(`/api/timetables/${subjectRes.data._id}`, {
          timetable: newSubject.timetable
        });
      }

      setShowAddSubject(false);
      setNewSubject({
        code: '',
        name: '',
        department: '',
        section: '',
        semester: '',
        credits: 3,
        faculty: '',
        timetable: []
      });
      setTimetableSlot({ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
      fetchDashboardData();
      alert('Subject created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleAddTimetableSlot = () => {
    setNewSubject({
      ...newSubject,
      timetable: [...newSubject.timetable, { ...timetableSlot }]
    });
    setTimetableSlot({ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
  };

  const handleRemoveTimetableSlot = (index) => {
    setNewSubject({
      ...newSubject,
      timetable: newSubject.timetable.filter((_, i) => i !== index)
    });
  };

  const handleMarkAttendance = async (studentId, subjectId, date, status = 'present') => {
    try {
      await api.post('/api/attendance/manual', {
        studentId,
        subjectId,
        date,
        status
      });
      fetchDashboardData();
      alert('Attendance marked successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleApproveRegistration = async (studentId) => {
    try {
      await api.post(`/api/face/approve/${studentId}`);
      fetchDashboardData();
    } catch (error) {
      alert('Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (studentId) => {
    try {
      await api.post(`/api/face/reject/${studentId}`);
      fetchDashboardData();
    } catch (error) {
      alert('Failed to reject registration');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      // Map frontend type to backend endpoint
      const endpoint = type === 'students' ? '/api/students' : 
                      type === 'subjects' ? '/api/subjects' : 
                      type === 'users' ? '/api/users' : 
                      `/api/${type}`;
      
      await api.delete(`${endpoint}/${id}`);
      fetchDashboardData();
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      alert(`Failed to delete ${type}: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!editingUser || !newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      await api.put(`/api/users/${editingUser._id}/password`, {
        newPassword
      });
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setEditingUser(null);
      setNewPassword('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleFaceUpdateComplete = async (frames) => {
    if (!editingStudent) {
      setShowFaceUpdateModal(false);
      return;
    }

    if (!frames || frames.length < 5) {
      alert('Please capture at least 5 frames');
      return;
    }

    try {
      const response = await api.put(`/api/face/update/${editingStudent._id}`, {
        imageData: frames[0],
        frames: frames
      });
      alert('Face data updated successfully!');
      setShowFaceUpdateModal(false);
      setEditingStudent(null);
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update face data');
      setShowFaceUpdateModal(false);
      setEditingStudent(null);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      department: user.department || '',
      universityId: user.universityId || '',
      isActive: user.isActive,
      isVerified: user.isVerified,
      role: user.role
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.put(`/api/users/${editingUser._id}`, editUserData);
      alert('User updated successfully!');
      setShowEditUserModal(false);
      setEditingUser(null);
      setEditUserData({});
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditStudentData({
      name: student.name,
      email: student.email,
      department: student.department || '',
      universityId: student.universityId || '',
      semester: student.semester,
      section: student.section || '',
      year: student.year
    });
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const studentData = {
        ...editStudentData,
        semester: parseInt(editStudentData.semester, 10),
        year: parseInt(editStudentData.year, 10)
      };
      await api.put(`/api/students/${editingStudent._id}`, studentData);
      alert('Student updated successfully!');
      setShowEditStudentModal(false);
      setEditingStudent(null);
      setEditStudentData({});
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update student');
    }
  };

  const tabs = ['overview', 'universities', 'campus', 'schools', 'programs', 'courses', 'branches', 'batches', 'admins', 'students', 'subjects', 'semesters', 'timetables', 'mark-attendance', 'attendance', 'analytics', 'admit-cards', 'override'];

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
              SuperAdmin Dashboard
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Welcome, {user?.name || 'Bibekananda Bariki'}
            </p>
          </div>
          <button onClick={logout} className="glass-button glass-button-secondary">
            Logout
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="tab-navigation">
          {tabs.map(tab => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.replace('-', ' ')}
            </motion.button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <GlassCard>
                <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  Total Students
                </h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
              {stats.totalStudents}
            </p>
          </GlassCard>
          <GlassCard>
                <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  Total Admins
                </h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
              {stats.totalAdmins}
            </p>
          </GlassCard>
          <GlassCard>
                <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  Total Subjects
                </h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
              {stats.totalSubjects}
            </p>
          </GlassCard>
          <GlassCard>
                <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  Pending Registrations
                </h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
              {stats.pendingRegistrations}
            </p>
          </GlassCard>
        </div>

            {analytics && (
              <>
                <GlassCard style={{ marginBottom: '2rem' }}>
                  <h2 style={{ color: 'white', marginBottom: '1rem' }}>
                    3D Attendance Visualization
                  </h2>
                  <Analytics3D data={analytics} />
                </GlassCard>
                <AttendanceCharts analytics={analytics} />
                <div style={{ marginTop: '2rem' }}>
                  <HeatmapCalendar dailyData={analytics.dailyHeatmap} />
                </div>
              </>
            )}
          </>
        )}

        {/* Universities Tab */}
        {activeTab === 'universities' && (
          <UniversityManagement />
        )}

        {/* Schools Tab */}
        {activeTab === 'schools' && (
          <SchoolManagement />
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <CourseManagement />
        )}

        {/* Campus Tab */}
        {activeTab === 'campus' && (
          <CampusManagement />
        )}

        {/* Programs Tab */}
        {activeTab === 'programs' && (
          <ProgramManagement />
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <BranchManagement />
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <BatchManagement />
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <>
            <GlassCard style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: 'white' }}>All Admins</h2>
                <button
                  onClick={() => setShowAddAdmin(true)}
                  className="glass-button"
                >
                  Create Admin
                </button>
              </div>

              {showAddAdmin && (
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
                  <h3 style={{ color: 'white', marginBottom: '1rem' }}>Create New Admin</h3>
                  <form onSubmit={handleCreateAdmin}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                      <input
                        className="glass-input"
                        placeholder="Full Name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        type="email"
                        placeholder="Email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        required
                      />
                      <input
                        className="glass-input"
                        type="password"
                        placeholder="Password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        required
                        minLength={6}
                      />
                      <input
                        className="glass-input"
                        placeholder="Department"
                        value={newAdmin.department}
                        onChange={(e) => setNewAdmin({ ...newAdmin, department: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="glass-button">
                        Create Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAdmin(false)}
                        className="glass-button glass-button-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {admins.map(admin => (
                  <motion.div
                    key={admin._id}
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
                      <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {admin.name}
                      </p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        {admin.email} | {admin.department || 'N/A'}
                      </p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                        Status: {admin.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditUser(admin)}
                        className="glass-button"
                        style={{ 
                          padding: '0.5rem 1rem', 
                          fontSize: '0.85rem',
                          background: 'rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(admin);
                          setNewPassword('');
                          setShowPasswordModal(true);
                        }}
                        className="glass-button"
                        style={{ 
                          padding: '0.5rem 1rem', 
                          fontSize: '0.85rem',
                          background: 'rgba(251, 191, 36, 0.3)'
                        }}
                      >
                        Change Password
                      </button>
                      <button
                        onClick={() => handleDelete('users', admin._id)}
                        className="glass-button"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          background: 'rgba(248, 113, 113, 0.8)'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            <GlassCard style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: 'white' }}>All Students</h2>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="glass-button"
                >
                  Create Student
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
                  <form onSubmit={handleCreateStudent}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                      <input
                        className="glass-input"
                        placeholder="Full Name"
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
                        placeholder="Semester (1-8)"
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
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="glass-button">
                        Create Student
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

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {student.name}
                      </p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        {student.email} | {student.universityId} | {student.department}
                      </p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                        Status: {student.registrationStatus || 'not registered'} | Semester {student.semester}
                        {student.section && ` | Section: ${student.section}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="glass-button"
                        style={{ 
                          padding: '0.5rem 1rem', 
                          fontSize: '0.85rem',
                          background: 'rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        Edit
                      </button>
                      {student.registrationStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveRegistration(student._id)}
                            className="glass-button"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRegistration(student._id)}
                            className="glass-button glass-button-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(student.faceRegistered || student.registrationStatus === 'approved') && (
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setShowFaceUpdateModal(true);
                          }}
                          className="glass-button"
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.85rem',
                            background: 'rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          Update Face
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete('students', student._id)}
                        className="glass-button"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          background: 'rgba(248, 113, 113, 0.8)'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <SubjectManagement />
        )}

        {/* Semesters Tab */}
        {activeTab === 'semesters' && (
          <SemesterManagement />
        )}

        {/* Timetables Tab */}
        {activeTab === 'timetables' && (
          <TimetableManagement />
        )}

        {/* Mark Attendance Tab */}
        {activeTab === 'mark-attendance' && (
          <AdminAttendanceMarking />
        )}

        {/* Timetable Tab (old) */}
        {activeTab === 'timetable' && (
        <GlassCard>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Weekly Timetable</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {Object.entries(timetable).map(([day, classes]) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px'
                  }}
                >
                  <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                    {day}
                  </h3>
                  {classes.length === 0 ? (
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
                      No classes scheduled
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {classes.map((classItem, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <p style={{ color: 'white', fontWeight: 'bold' }}>
                              {classItem.subject?.name || 'Unknown'}
                            </p>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                              {classItem.time} | {classItem.room || 'TBA'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
        </GlassCard>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            <GlassCard style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Face Recognition Attendance</h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                  Select Subject & Time Slot
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
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
      </div>

              {selectedSubject && (
                <div>
                  {(() => {
                    const subject = subjects.find(s => s._id === selectedSubject);
                    return (
                      <>
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                          {subject?.timetable && subject.timetable.length > 0 ? (
                            <>Available Slots: {subject.timetable.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}</>
                          ) : (
                            'No timetable slots configured. Please add timetable slots in the Subjects tab.'
                          )}
                        </p>
                        <FaceRecognitionCapture
                          subjectId={selectedSubject}
                          onAttendanceMarked={handleAttendanceMarked}
                        />
                      </>
                    );
                  })()}
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Manual Attendance Marking by Subject</h2>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {subjects.map(subject => {
                  const subjectStudents = students.filter(s => 
                    subject.students?.includes(s._id) || 
                    (s.department === subject.department && parseInt(s.semester) === parseInt(subject.semester))
                  );
                  
                  if (subjectStudents.length === 0) return null;
                  
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
                      {subject.timetable.map((slot, slotIndex) => (
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
                      ))}
                      {(!subject.timetable || subject.timetable.length === 0) && (
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
                })}
              </div>
            </GlassCard>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <>
            <GlassCard style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>
                Overall Statistics
              </h2>
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
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                    Absent
                  </p>
                  <p style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {analytics.absentCount}
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

        {/* Admit Cards Tab */}
        {activeTab === 'admit-cards' && (
          <AdmitCardGeneration />
        )}

        {/* SuperAdmin Override Tab */}
        {activeTab === 'override' && (
          <SuperAdminOverride />
        )}

        {/* Password Change Modal */}
        {showPasswordModal && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card"
              style={{ maxWidth: '500px', width: '100%' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: 'white' }}>Change Password for {editingUser.name}</h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setEditingUser(null);
                    setNewPassword('');
                  }}
                  className="glass-button glass-button-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleChangePassword}>
                <input
                  type="password"
                  className="glass-input"
                  placeholder="New Password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: '100%', marginBottom: '1rem' }}
                />
                <button type="submit" className="glass-button" style={{ width: '100%' }}>
                  Update Password
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Face Update Modal */}
        {showFaceUpdateModal && editingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card"
              style={{ maxWidth: '600px', width: '100%' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: 'white' }}>Update Face Data for {editingStudent.name}</h2>
                <button
                  onClick={() => {
                    setShowFaceUpdateModal(false);
                    setEditingStudent(null);
                  }}
                  className="glass-button glass-button-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Close
                </button>
              </div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                Please rotate your head slowly in a circular motion to capture multiple angles.
              </p>
              <WebcamCapture 
                onComplete={handleFaceUpdateComplete}
                isUpdate={true}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: 'white' }}>Edit User: {editingUser.name}</h2>
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                    setEditUserData({});
                  }}
                  className="glass-button glass-button-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    className="glass-input"
                    placeholder="Full Name"
                    value={editUserData.name || ''}
                    onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                    required
                  />
                  <input
                    className="glass-input"
                    type="email"
                    placeholder="Email"
                    value={editUserData.email || ''}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    required
                  />
                  <input
                    className="glass-input"
                    placeholder="Department"
                    value={editUserData.department || ''}
                    onChange={(e) => setEditUserData({ ...editUserData, department: e.target.value })}
                  />
                  <input
                    className="glass-input"
                    placeholder="University ID"
                    value={editUserData.universityId || ''}
                    onChange={(e) => setEditUserData({ ...editUserData, universityId: e.target.value })}
                  />
                  <select
                    className="glass-input"
                    value={editUserData.role || 'admin'}
                    onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="student">Student</option>
                    <option value="superadmin">SuperAdmin</option>
                  </select>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editUserData.isActive !== undefined ? editUserData.isActive : true}
                        onChange={(e) => setEditUserData({ ...editUserData, isActive: e.target.checked })}
                      />
                      Active
                    </label>
                    <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editUserData.isVerified !== undefined ? editUserData.isVerified : false}
                        onChange={(e) => setEditUserData({ ...editUserData, isVerified: e.target.checked })}
                      />
                      Verified
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="glass-button" style={{ flex: 1 }}>
                    Update User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditUserModal(false);
                      setEditingUser(null);
                      setEditUserData({});
                    }}
                    className="glass-button glass-button-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Student Modal */}
        {showEditStudentModal && editingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: 'white' }}>Edit Student: {editingStudent.name}</h2>
                <button
                  onClick={() => {
                    setShowEditStudentModal(false);
                    setEditingStudent(null);
                    setEditStudentData({});
                  }}
                  className="glass-button glass-button-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleUpdateStudent}>
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    className="glass-input"
                    placeholder="Full Name"
                    value={editStudentData.name || ''}
                    onChange={(e) => setEditStudentData({ ...editStudentData, name: e.target.value })}
                    required
                  />
                  <input
                    className="glass-input"
                    type="email"
                    placeholder="Email"
                    value={editStudentData.email || ''}
                    onChange={(e) => setEditStudentData({ ...editStudentData, email: e.target.value })}
                    required
                  />
                  <input
                    className="glass-input"
                    placeholder="University ID"
                    value={editStudentData.universityId || ''}
                    onChange={(e) => setEditStudentData({ ...editStudentData, universityId: e.target.value })}
                    required
                  />
                  <input
                    className="glass-input"
                    placeholder="Department"
                    value={editStudentData.department || ''}
                    onChange={(e) => setEditStudentData({ ...editStudentData, department: e.target.value })}
                    required
                  />
                  <input
                    className="glass-input"
                    placeholder="Section (optional, e.g., A, B, CSE-A)"
                    value={editStudentData.section || ''}
                    onChange={(e) => setEditStudentData({ ...editStudentData, section: e.target.value })}
                  />
                  <input
                    className="glass-input"
                    type="number"
                    placeholder="Semester (1-8)"
                    min="1"
                    max="8"
                    value={editStudentData.semester || ''}
                    onChange={(e) => setEditStudentData({ ...editStudentData, semester: e.target.value })}
                    required
                  />
                  <input
                    className="glass-input"
                    type="number"
                    placeholder="Year"
                    value={editStudentData.year || ''}
                    onChange={(e) => setEditStudentData({ ...editStudentData, year: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="glass-button" style={{ flex: 1 }}>
                    Update Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditStudentModal(false);
                      setEditingStudent(null);
                      setEditStudentData({});
                    }}
                    className="glass-button glass-button-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
