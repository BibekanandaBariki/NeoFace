import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import '../styles/glassmorphism.css';

const SectionTimetableView = ({ branch, section, semester }) => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (branch && section && semester) {
      console.log('SectionTimetableView - Fetching timetable with:', { branch, section, semester });
      fetchSectionTimetable();
    } else {
      console.log('SectionTimetableView - Missing data:', { branch, section, semester });
    }
  }, [branch, section, semester]);

  const fetchSectionTimetable = async () => {
    try {
      setLoading(true);
      console.log('Fetching timetable from:', `/api/timetables/section/${branch}/${section}/${semester}`);
      const response = await api.get(`/api/timetables/section/${branch}/${section}/${semester}`);
      console.log('Timetable response:', response.data);
      setTimetable(response.data);
    } catch (err) {
      console.error('Fetch timetable error:', err.response || err);
      if (err.response?.data?.emptySchedule) {
        setTimetable(null);
      } else {
        setError('Failed to load timetable');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.6)' }}>
        Loading timetable...
      </div>
    );
  }

  if (!timetable) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.6)' }}>
        No timetable available for your section yet
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
          Weekly Timetable
        </h2>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
          {branch} - Section {section} | Semester {timetable.semesterNumber} | {timetable.academicYear}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255, 107, 107, 0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {timetable.schedule.map((day) => (
          <motion.div
            key={day.dayOfWeek}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', margin: 0 }}>{day.dayName}</h3>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                background: day.slots?.length > 0 ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255,255,255,0.1)',
                color: day.slots?.length > 0 ? '#4cd137' : 'rgba(255,255,255,0.5)'
              }}>
                {day.slots?.length || 0} {day.slots?.length === 1 ? 'period' : 'periods'}
              </span>
            </div>

            {!day.slots || day.slots.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', textAlign: 'center' }}>
                No classes scheduled
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {day.slots.map((slot, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      padding: '1rem',
                      background: slot.isBreak ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      borderLeft: slot.isBreak ? '3px solid rgba(255,255,255,0.3)' : '3px solid #4cd137'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                          Period {slot.slotNumber}
                        </div>
                      </div>

                      {slot.isBreak ? (
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                          {slot.breakType === 'lunch' ? 'Lunch Break' : 'Break'}
                        </div>
                      ) : (
                        <div>
                          <div style={{ color: 'white', fontWeight: 'bold' }}>
                            {slot.subject?.code} - {slot.subject?.name}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                            Faculty: {slot.faculty?.name || slot.facultyName || 'TBA'}
                          </div>
                        </div>
                      )}

                      {slot.room && (
                        <div style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(76, 209, 55, 0.2)',
                          borderRadius: '6px',
                          color: '#4cd137',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}>
                          {slot.room}
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
    </div>
  );
};

export default SectionTimetableView;
