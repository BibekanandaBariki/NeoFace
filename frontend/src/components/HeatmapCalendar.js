import React from 'react';
import { motion } from 'framer-motion';

const HeatmapCalendar = ({ dailyData }) => {
  if (!dailyData || Object.keys(dailyData).length === 0) {
    return (
      <div className="glass-card">
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No attendance data available</p>
      </div>
    );
  }

  const dates = Object.keys(dailyData)
    .map(date => ({
      date,
      ...dailyData[date],
      attendancePercent: dailyData[date].total > 0
        ? (dailyData[date].present / dailyData[date].total) * 100
        : 0
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30); // Last 30 days

  const getColor = (percent) => {
    if (percent >= 80) return 'rgba(74, 222, 128, 0.8)'; // Green
    if (percent >= 60) return 'rgba(251, 191, 36, 0.8)'; // Yellow
    if (percent >= 40) return 'rgba(251, 146, 60, 0.8)'; // Orange
    return 'rgba(248, 113, 113, 0.8)'; // Red
  };

  return (
    <div className="glass-card">
      <h3 style={{ color: 'white', marginBottom: '1rem' }}>Attendance Heatmap</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem'
      }}>
        {dates.map((day, index) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            style={{
              aspectRatio: '1',
              background: getColor(day.attendancePercent),
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              position: 'relative'
            }}
            whileHover={{ scale: 1.1, zIndex: 10 }}
            title={`${new Date(day.date).toLocaleDateString()}: ${day.attendancePercent.toFixed(1)}%`}
          >
            <span style={{
              fontSize: '0.7rem',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {new Date(day.date).getDate()}
            </span>
            <span style={{
              fontSize: '0.6rem',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              {day.attendancePercent.toFixed(0)}%
            </span>
          </motion.div>
        ))}
      </div>
      <div style={{
        marginTop: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.85rem',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: 'rgba(74, 222, 128, 0.8)',
              borderRadius: '3px'
            }} />
            <span>80%+</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: 'rgba(251, 191, 36, 0.8)',
              borderRadius: '3px'
            }} />
            <span>60-79%</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: 'rgba(248, 113, 113, 0.8)',
              borderRadius: '3px'
            }} />
            <span>&lt;60%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapCalendar;

