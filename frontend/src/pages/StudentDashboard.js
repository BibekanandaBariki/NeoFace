import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import WebcamCapture from '../components/WebcamCapture';
import GlassCard from '../components/GlassCard';
import AttendanceCharts from '../components/AttendanceCharts';
import HeatmapCalendar from '../components/HeatmapCalendar';
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, attendanceRes, timetableRes, analyticsRes] = await Promise.all([
        api.get('/api/subjects'),
        api.get('/api/attendance'),
        api.get('/api/timetable'),
        api.get('/api/analytics/overview')
      ]);

      setSubjects(subjectsRes.data);
      setAttendance(attendanceRes.data);
      setTimetable(timetableRes.data);
      setAnalytics(analyticsRes.data);
      
      // Check face registration status
      const userData = await api.get('/api/auth/me');
      const isFaceRegistered = userData.data.faceRegistered || false;
      let regStatus = userData.data.registrationStatus; // Can be null, 'pending', 'approved', or 'rejected'
      
      // Debug log (remove in production)
      console.log('Face registration status:', { 
        isFaceRegistered, 
        regStatus, 
        userData: userData.data,
        faceRegisteredFromAPI: userData.data.faceRegistered,
        registrationStatusFromAPI: userData.data.registrationStatus
      });
      
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
                    marginTop: '0.5rem' 
                  }}>
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
                  {subject.faculty && (
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Faculty: {subject.faculty.name}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <GlassCard>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Attendance Records</h2>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {attendance.length === 0 ? (
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '2rem' }}>
                  No attendance records found
                </p>
              ) : (
                attendance.map(record => (
                  <motion.div
                  key={record._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
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
                        {record.subjectId?.name || 'Unknown Subject'}
                      </p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                        Marked by: {record.markedBy || 'Unknown'}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      background: record.status === 'present'
                        ? 'rgba(74, 222, 128, 0.3)'
                        : record.status === 'late'
                        ? 'rgba(251, 191, 36, 0.3)'
                        : 'rgba(248, 113, 113, 0.3)',
                      color: 'white',
                      fontWeight: 'bold',
                      textTransform: 'capitalize'
                    }}>
                      {record.status}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        )}

        {/* Timetable Tab */}
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
