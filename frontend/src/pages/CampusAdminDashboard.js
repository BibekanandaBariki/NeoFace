import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import BranchManagement from '../components/BranchManagement';
import BatchManagement from '../components/BatchManagement';
import AdmitCardGeneration from '../components/AdmitCardGeneration';
import '../styles/glassmorphism.css';

const CampusAdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalBranches: 0,
    totalBatches: 0,
    totalStudents: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  const tabs = ['overview', 'branches', 'batches', 'admit-cards'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real implementation, this would fetch actual data
      // For now, we'll use placeholder data
      setStats({
        totalBranches: 4,
        totalBatches: 8,
        totalStudents: 480,
        pendingApprovals: 12
      });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
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
              Campus Admin Dashboard
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Welcome, Campus Administrator
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
                Total Branches
              </h3>
              <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                {stats.totalBranches}
              </p>
            </GlassCard>
            <GlassCard>
              <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                Total Batches
              </h3>
              <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                {stats.totalBatches}
              </p>
            </GlassCard>
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
                Pending Approvals
              </h3>
              <p style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold' }}>
                {stats.pendingApprovals}
              </p>
            </GlassCard>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <BranchManagement />
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <BatchManagement />
        )}

        {/* Admit Cards Tab */}
        {activeTab === 'admit-cards' && (
          <AdmitCardGeneration />
        )}
      </div>
    </div>
  );
};

export default CampusAdminDashboard;