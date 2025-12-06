import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import CampusManagement from '../components/CampusManagement';
import SchoolManagement from '../components/SchoolManagement';
import ProgramManagement from '../components/ProgramManagement';
import CourseManagement from '../components/CourseManagement';
import '../styles/glassmorphism.css';

const UniversityAdminDashboard = () => {
  const { logout } = useAuth(); // Remove unused 'user' variable
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalCampuses: 0,
    totalSchools: 0,
    totalPrograms: 0,
    totalCourses: 0
  });

  const tabs = ['overview', 'campus', 'schools', 'programs', 'courses'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real implementation, this would fetch actual data
      // For now, we'll use placeholder data
      setStats({
        totalCampuses: 2,
        totalSchools: 4,
        totalPrograms: 8,
        totalCourses: 16
      });
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

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
              University Admin Dashboard
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Welcome, University Administrator
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <GlassCard>
              <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                Total Campuses
              </h3>
              <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                {stats.totalCampuses}
              </p>
            </GlassCard>
            <GlassCard>
              <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                Total Schools
              </h3>
              <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                {stats.totalSchools}
              </p>
            </GlassCard>
            <GlassCard>
              <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                Total Programs
              </h3>
              <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                {stats.totalPrograms}
              </p>
            </GlassCard>
            <GlassCard>
              <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                Total Courses
              </h3>
              <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                {stats.totalCourses}
              </p>
            </GlassCard>
          </div>
        )}

        {/* Campus Tab */}
        {activeTab === 'campus' && (
          <CampusManagement />
        )}

        {/* Schools Tab */}
        {activeTab === 'schools' && (
          <SchoolManagement />
        )}

        {/* Programs Tab */}
        {activeTab === 'programs' && (
          <ProgramManagement />
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <CourseManagement />
        )}
      </div>
    </div>
  );
};

export default UniversityAdminDashboard;