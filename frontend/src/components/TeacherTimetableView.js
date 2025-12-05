import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/glassmorphism.css';

const TeacherTimetableView = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchTeacherTimetable();
    }
  }, [user]);

  const fetchTeacherTimetable = async () => {
    try {
      setLoading(true);
      console.log('Fetching teacher timetable for user object:', user);
      // Handle both id and _id fields for consistency
      const userId = user.id || user._id;
      console.log('Using userId for API call:', userId);
      const response = await api.get(`/timetables/teacher/${userId}`);
      console.log('Teacher timetable response:', response.data);
      setSchedule(response.data.schedule);
    } catch (err) {
      console.error('Teacher timetable error:', err.response || err);
      setError('Failed to load your timetable');
    } finally {
      setLoading(false);
    }
  };

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hasAnyClasses = Object.values(schedule).some(day => day && day.length > 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.6)' }}>
        Loading your timetable...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        My Teaching Schedule
      </h2>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255, 107, 107, 0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {!hasAnyClasses ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
          No classes assigned yet
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {DAYS.map((day) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'white', margin: 0 }}>{day}</h3>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  background: schedule[day]?.length > 0 ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: schedule[day]?.length > 0 ? '#4cd137' : 'rgba(255,255,255,0.5)'
                }}>
                  {schedule[day]?.length || 0} {schedule[day]?.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              {!schedule[day] || schedule[day].length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', textAlign: 'center' }}>
                  No classes scheduled
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {schedule[day].map((classItem, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #4cd137'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                            {classItem.time}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                            Period {classItem.slotNumber}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'white', fontWeight: 'bold' }}>
                            {classItem.subject?.code} - {classItem.subject?.name}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                            {classItem.branch} Section {classItem.section} | Semester {classItem.semesterNumber}
                          </div>
                        </div>

                        {classItem.room && (
                          <div style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(76, 209, 55, 0.2)',
                            borderRadius: '6px',
                            color: '#4cd137',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}>
                            {classItem.room}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {Object.keys(schedule).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ marginTop: '2rem' }}
        >
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>Weekly Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                {Object.values(schedule).reduce((total, day) => total + (day?.length || 0), 0)}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Total Classes/Week</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                {Object.values(schedule).filter(day => day && day.length > 0).length}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Working Days</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                {[...new Set(
                  Object.values(schedule)
                    .flat()
                    .filter(c => c)
                    .map(c => `${c.branch}-${c.section}`)
                )].length}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>Sections Taught</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TeacherTimetableView;
