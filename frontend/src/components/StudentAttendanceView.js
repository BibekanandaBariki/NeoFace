import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import '../styles/glassmorphism.css';

const StudentAttendanceView = ({ studentId }) => {
  const [viewMode, setViewMode] = useState('overview'); // overview, daywise, subjectwise
  const [summary, setSummary] = useState(null);
  const [dayWise, setDayWise] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentId) {
      fetchAttendanceData();
    }
  }, [studentId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [summaryRes, dayWiseRes] = await Promise.all([
        api.get(`/api/attendance/student/${studentId}/summary`),
        api.get(`/api/attendance/student/${studentId}/day-wise`)
      ]);
      setSummary(summaryRes.data);
      setDayWise(dayWiseRes.data);
    } catch (err) {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return '#4cd137';
    if (percentage >= 60) return '#ffa502';
    return '#ff6b6b';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.6)' }}>
        Loading attendance data...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* View Mode Selector */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['overview', 'daywise', 'subjectwise'].map((mode) => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode(mode)}
            className="glass-button"
            style={{
              padding: '0.75rem 1.5rem',
              background: viewMode === mode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
            }}
          >
            {mode === 'overview' ? 'Overview' : mode === 'daywise' ? 'Day-wise' : 'Subject-wise'}
          </motion.button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255, 107, 107, 0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {/* Overview Mode */}
      {viewMode === 'overview' && summary && (
        <div>
          {/* Overall Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ marginBottom: '2rem', textAlign: 'center' }}
          >
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Overall Attendance</h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: getAttendanceColor(summary.overall.percentage) }}>
              {summary.overall.percentage}%
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
              {summary.overall.present} / {summary.overall.total} classes attended
            </div>
          </motion.div>

          {/* Subject-wise Summary Cards */}
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>Subject-wise Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {Object.values(summary.subjectWise).map((subj) => (
              <motion.div
                key={subj.subject._id}
                whileHover={{ scale: 1.05 }}
                className="glass-card"
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ color: 'white', fontWeight: 'bold' }}>{subj.subject.code}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{subj.subject.name}</div>
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${subj.percentage}%`,
                      height: '100%',
                      background: getAttendanceColor(subj.percentage),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      {subj.present}/{subj.total} classes
                    </span>
                    <span style={{ color: getAttendanceColor(subj.percentage), fontWeight: 'bold' }}>
                      {subj.percentage}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Day-wise Mode */}
      {viewMode === 'daywise' && (
        <div>
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>Day-wise Attendance</h3>
          {dayWise.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>
              No attendance records found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {dayWise.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: 'bold' }}>
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {day.summary.present}/{day.summary.total} classes attended
                      </div>
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: day.summary.present === day.summary.total 
                        ? 'rgba(76, 209, 55, 0.2)' 
                        : 'rgba(255, 107, 107, 0.2)',
                      color: day.summary.present === day.summary.total ? '#4cd137' : '#ff6b6b',
                      fontWeight: 'bold'
                    }}>
                      {day.summary.present === day.summary.total ? 'Full Attendance' : 'Partial'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {day.classes.map((cls, clsIndex) => (
                      <div
                        key={clsIndex}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${cls.status === 'present' ? '#4cd137' : '#ff6b6b'}`
                        }}
                      >
                        <div>
                          <div style={{ color: 'white', fontWeight: '500' }}>
                            {cls.subject?.code} - {cls.subject?.name}
                          </div>
                          {cls.slotNumber && (
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                              Period {cls.slotNumber}
                            </div>
                          )}
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          background: cls.status === 'present' ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                          color: cls.status === 'present' ? '#4cd137' : '#ff6b6b'
                        }}>
                          {cls.status === 'present' ? 'Present' : 'Absent'}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subject-wise Mode */}
      {viewMode === 'subjectwise' && summary && (
        <div>
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>Subject-wise Detailed View</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.values(summary.subjectWise).map((subj) => (
              <motion.div
                key={subj.subject._id}
                whileHover={{ scale: 1.02 }}
                className="glass-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {subj.subject.code}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)' }}>{subj.subject.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getAttendanceColor(subj.percentage) }}>
                      {subj.percentage}%
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      {subj.present}/{subj.total} classes
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(76, 209, 55, 0.1)', borderRadius: '8px' }}>
                    <div style={{ color: '#4cd137', fontSize: '1.5rem', fontWeight: 'bold' }}>{subj.present}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Present</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '8px' }}>
                    <div style={{ color: '#ff6b6b', fontSize: '1.5rem', fontWeight: 'bold' }}>{subj.absent}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Absent</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                    <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>{subj.total}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Total</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${subj.percentage}%`,
                      height: '100%',
                      background: getAttendanceColor(subj.percentage),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceView;
