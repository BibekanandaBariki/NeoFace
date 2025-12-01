import React from 'react';
import { motion } from 'framer-motion';
import '../styles/glassmorphism.css';

const SectionTimetableView = ({ timetable }) => {
  console.log('=== SECTION TIMETABLE VIEW ===');
  console.log('Received timetable data:', timetable);
  console.log('Timetable type:', typeof timetable);
  console.log('Has schedule:', timetable && timetable.schedule);
  
  // If no timetable data is passed, show a loading or empty state
  if (!timetable || !timetable.schedule) {
    console.log('Showing empty state - no timetable data');
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.6)' }}>
        No timetable available for your section yet
      </div>
    );
  }

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Convert the timetable schedule to a format we can use
  const schedule = {};
  timetable.schedule.forEach(day => {
    schedule[day.dayName] = day.slots || [];
  });
  
  const hasAnyClasses = Object.values(schedule).some(day => day && day.length > 0);
  
  console.log('Schedule data:', schedule);
  console.log('Has any classes:', hasAnyClasses);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
          Weekly Timetable
        </h2>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
          {timetable.branch?.code || 'Unknown'} - Section {timetable.section || 'Unknown'} | Semester {timetable.semesterNumber || 'Unknown'} | {timetable.academicYear || 'Unknown'}
        </div>
      </div>

      {!hasAnyClasses ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
          No classes scheduled
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
                  {schedule[day]?.length || 0} {schedule[day]?.length === 1 ? 'period' : 'periods'}
                </span>
              </div>

              {!schedule[day] || schedule[day].length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', textAlign: 'center' }}>
                  No classes scheduled
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {schedule[day].map((slot, index) => (
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
      )}
    </div>
  );
};

export default SectionTimetableView;