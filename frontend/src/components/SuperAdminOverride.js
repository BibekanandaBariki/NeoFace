import React, { useState } from 'react';
import api from '../utils/api';
import GlassCard from './GlassCard';

const SuperAdminOverride = () => {
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('present');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/override', {
        studentId,
        date,
        status
      });
      
      setStudentId('');
      setDate('');
      setStatus('present');
    } catch (error) {
      console.error('Error overriding attendance:', error);
    }
  };

  return (
    <div className="super-admin-override">
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Attendance Override</h2>
      
      <GlassCard>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                Student ID
              </label>
              <input
                type="text"
                className="glass-input"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                Date
              </label>
              <input
                type="date"
                className="glass-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                Status
              </label>
              <select
                className="glass-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="glass-button">
            Override Attendance
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default SuperAdminOverride;
