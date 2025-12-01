import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import WebcamCapture from '../components/WebcamCapture';
import GlassCard from '../components/GlassCard';
import AttendanceCharts from '../components/AttendanceCharts';
import HeatmapCalendar from '../components/HeatmapCalendar';
import StudentAttendanceView from '../components/StudentAttendanceView';
import SectionTimetableView from '../components/SectionTimetableView';
import '../styles/glassmorphism.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('not_registered');
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // First get student info
      const userData = await api.get('/api/auth/me');
      
      // Fetch subjects for this student (already filtered by backend)
      const subjectsRes = await api.get('/api/subjects');
      
      // Fetch attendance for this student (already filtered by backend)
      const attendanceRes = await api.get('/api/attendance');
      
      // Initialize timetable data
      let timetableRes = { data: {} };
      let studentTimetableInfo = {
        branch: userData.data.department,
        section: userData.data.section || '',
        semester: userData.data.semester
      };
      
      // Fetch timetable for student's branch/section
      console.log('=== TIMETABLE FETCH ATTEMPT ===');
      console.log('Student data for timetable:', {
        department: userData.data.department,
        section: userData.data.section
      });

      if (userData.data.department && userData.data.section) {
        console.log('Attempting to fetch section timetable');
        
        // Get the branch ObjectId
        let branchId = userData.data.department;
        console.log('Initial branchId:', branchId);
        
        // If department is a string code (like "CSE"), fetch the actual Branch ObjectId
        if (typeof userData.data.department === 'string' && userData.data.department.length < 24) {
          try {
            console.log('Fetching branch ID for code:', userData.data.department);
            const branchRes = await api.get('/api/branches', {
              params: { code: userData.data.department }
            });
            console.log('Branch response:', branchRes.data);
            
            if (branchRes.data && branchRes.data.length > 0) {
              branchId = branchRes.data[0]._id;
              // Update the studentTimetableInfo with the proper branch ID
              studentTimetableInfo.branch = branchId;
              console.log('Found branch ID:', branchId);
            } else {
              console.log('No branch found for code:', userData.data.department);
            }
          } catch (branchError) {
            console.log('Could not fetch branch ID, using code as fallback:', branchError);
          }
        }
        
        // Try to get semester ID
        console.log('Fetching semesters for branch:', branchId);
        try {
          const semestersRes = await api.get('/api/semesters', {
            params: {
              branch: branchId,
              isActive: true
            }
          });
          console.log('Semesters response:', semestersRes.data);
          
          // Find semester matching student's semester number
          const activeSemester = semestersRes.data.find(s => {
            const branchMatch = s.branch.toString() === branchId.toString();
            const semesterMatch = s.semesterNumber === parseInt(userData.data.semester);
            console.log('Checking semester:', s.semesterNumber, 'Branch match:', branchMatch, 'Semester match:', semesterMatch);
            return branchMatch && semesterMatch;
          });
          
          console.log('Active semester found:', activeSemester);
          
          // Use the semester ID, not the semester number
          const semesterId = activeSemester?._id || userData.data.semester;
          
          // Update the studentTimetableInfo with the proper semester ID
          studentTimetableInfo.semester = semesterId;
          
          console.log('Fetching timetable with:', {
            branchId,
            section: userData.data.section,
            semesterId
          });
          
          // Try to get section timetable
          try {
            timetableRes = await api.get(`/api/timetables/section/${branchId}/${userData.data.section}/${semesterId}`);
            console.log('Section timetable response:', timetableRes.data);
          } catch (timetableError) {
            console.log('Could not fetch section timetable:', timetableError.response || timetableError);
            // Fallback to general timetables endpoint (already filtered by backend)
            timetableRes = await api.get('/api/timetables');
          }
        } catch (semesterError) {
          console.log('Could not fetch semesters:', semesterError);
          // Fallback to general timetables endpoint (already filtered by backend)
          timetableRes = await api.get('/api/timetables');
        }
      } else {
        console.log('Missing department or section, falling back to general timetables');
        // Fallback to general timetables endpoint (already filtered by backend)
        timetableRes = await api.get('/api/timetables');
      }
      
      // Fetch analytics
      const analyticsRes = await api.get('/api/analytics/overview');

      setSubjects(subjectsRes.data);
      setAttendance(attendanceRes.data);
      setTimetable(timetableRes.data);
      setAnalytics(analyticsRes.data);

      console.log('Timetable data:', timetableRes.data);

      const isFaceRegistered = userData.data.faceRegistered || false;
      let regStatus = userData.data.registrationStatus; // Can be null, 'pending', 'approved', or 'rejected'
      
      // Store student info for timetable (with proper IDs)
      setStudentInfo(studentTimetableInfo);
      
      // Set registration status, default to 'not_registered' if null/undefined/empty
      if (regStatus === null || regStatus === undefined || regStatus === '') {
        regStatus = 'not_registered';
      }
      setRegistrationStatus(regStatus);
      
      // Only show as registered if registrationStatus is 'approved' (backend logic ensures faceRegistered is true when approved)
      // The backend /api/auth/me already checks and sets faceRegistered correctly based on approval status
      setFaceRegistered(regStatus === 'approved');
    } catch (error) {
      console.error('Fetch error:', error);
      // On error, default to not_registered so user can still try to register
      setRegistrationStatus('not_registered');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceMarked = (newAttendanceRecord) => {
    setAttendance(prev => [newAttendanceRecord, ...prev]);
  };

  const handleFaceRegistered = () => {
    setShowFaceRegister(false);
    setFaceRegistered(true);
    fetchData();
  };

  const tabs = ['overview', 'subjects', 'attendance', 'timetable', 'analytics'];

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
              Student Dashboard
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Welcome, {user?.name || 'Student'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {!loading && registrationStatus === 'not_registered' && (
              <button
                onClick={() => setShowFaceRegister(true)}
                className="glass-button"
              >
                Register Face
              </button>
            )}
            {!loading && registrationStatus === 'pending' && (
              <button
                className="glass-button"
                style={{ background: 'rgba(251, 191, 36, 0.3)' }}
                disabled
              >
                Registration Pending
              </button>
            )}
            {!loading && registrationStatus === 'rejected' && (
              <button
                onClick={() => setShowFaceRegister(true)}
                className="glass-button"
                style={{ background: 'rgba(248, 113, 113, 0.3)' }}
              >
                Re-register Face
              </button>
            )}
            {/* Fallback: Show register button if status is unclear or still loading */}
            {!loading && !['not_registered', 'pending', 'approved', 'rejected'].includes(registrationStatus) && (
              <button
                onClick={() => setShowFaceRegister(true)}
                className="glass-button"
              >
                Register Face
              </button>
            )}
          <button onClick={logout} className="glass-button glass-button-secondary">
            Logout
          </button>
          </div>
        </motion.div>

        {/* Face Registration Modal */}
        {showFaceRegister && (
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
                <h2 style={{ color: 'white' }}>Register Your Face</h2>
                <button
                  onClick={() => setShowFaceRegister(false)}
                  className="glass-button glass-button-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Close
                </button>
              </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                Please rotate your head slowly in a circular motion to capture multiple angles.
                This helps improve face recognition accuracy.
            </p>
            <WebcamCapture onComplete={handleFaceRegistered} />
            </motion.div>
          </motion.div>
        )}

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
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Overall Attendance</h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                  {analytics?.attendance?.toFixed(1) || 0}%
                </p>
              </GlassCard>
              <GlassCard>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Total Classes</h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                  {analytics?.totalClasses || 0}
                </p>
              </GlassCard>
              <GlassCard>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>My Subjects</h3>
                <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                  {subjects.length}
                </p>
              </GlassCard>
              <GlassCard>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Face Status</h3>
                <p style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: registrationStatus === 'approved'
                    ? '#4ade80' 
                    : registrationStatus === 'pending' 
                      ? '#fbbf24' 
                      : '#f87171'
                }}>
                  {registrationStatus === 'approved'
                    ? '✅ Registered & Approved' 
                    : registrationStatus === 'pending'
                      ? '⏳ Pending Approval'
                      : registrationStatus === 'rejected'
                        ? '❌ Registration Rejected'
                        : '❌ Not Registered'}
                </p>
                {registrationStatus === 'pending' && (
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.85rem', 
                    marginTop: '0.5rem' }}>
                    Your face registration is waiting for admin approval
                  </p>
                )}
                {registrationStatus === 'not_registered' && (
                  <>
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '0.85rem', 
                      marginTop: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      Please register your face to enable attendance marking
                    </p>
                    <button
                      onClick={() => setShowFaceRegister(true)}
                      className="glass-button"
                      style={{ width: '100%' }}
                    >
                      Register Face Now
                    </button>
                  </>
                )}
                {registrationStatus === 'rejected' && (
                  <>
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '0.85rem', 
                      marginTop: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      Your registration was rejected. Please try registering again.
                    </p>
                    <button
                      onClick={() => setShowFaceRegister(true)}
                      className="glass-button"
                      style={{ width: '100%', background: 'rgba(248, 113, 113, 0.3)' }}
                    >
                      Re-register Face
                    </button>
                  </>
                )}
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

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <GlassCard>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>My Subjects</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {subjects.map(subject => (
                <motion.div
                  key={subject._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px'
                  }}
                >
                  <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {subject.name}
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Code: {subject.code}
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                    {subject.department} | Semester {subject.semester}
                  </p>
                  {subject.faculty && subject.faculty.length > 0 && (
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Faculty: {subject.faculty[0].teacher?.name || 'Not assigned'}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && user && (
          <StudentAttendanceView studentId={user.id} />
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && studentInfo && (
          <SectionTimetableView 
            timetable={timetable}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <>
            <GlassCard style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>My Analytics</h2>
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
      </div>
    </div>
  );
};

export default StudentDashboard;
