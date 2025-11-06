import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import '../styles/glassmorphism.css';

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [campuses, setCampuses] = useState([]); // Add campuses state
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    level: 'undergraduate',
    campus: '', // Add campus field
    duration: {
      years: 4,
      semesters: 8
    },
    eligibilityCriteria: '',
    description: ''
  });

  const levels = ['undergraduate', 'postgraduate', 'diploma', 'phd', 'certificate'];

  useEffect(() => {
    fetchPrograms();
    fetchCampuses(); // Fetch campuses on component mount
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/programs');
      setPrograms(response.data);
    } catch (err) {
      setError('Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampuses = async () => {
    try {
      const response = await api.get('/api/campus');
      setCampuses(response.data);
    } catch (err) {
      setError('Failed to fetch campuses');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/api/programs/${editingId}`, formData);
        setSuccess('Program updated successfully!');
      } else {
        await api.post('/api/programs', formData);
        setSuccess('Program created successfully!');
      }
      resetForm();
      fetchPrograms();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} program`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (program) => {
    setEditingId(program._id);
    setFormData({
      code: program.code,
      name: program.name,
      shortName: program.shortName,
      level: program.level,
      campus: program.campus?._id || '', // Set campus ID
      duration: program.duration,
      eligibilityCriteria: program.eligibilityCriteria || '',
      description: program.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;

    try {
      await api.delete(`/api/programs/${id}`);
      setSuccess('Program deleted successfully!');
      fetchPrograms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete program');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      shortName: '',
      level: 'undergraduate',
      campus: '', // Reset campus field
      duration: { years: 4, semesters: 8 },
      eligibilityCriteria: '',
      description: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Program Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Add Program'}
        </motion.button>
      </div>

      {error && (
        <div className="notification-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="notification-success">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: '1.5rem', marginBottom: '2rem' }}
        >
          <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>
            {editingId ? 'Edit Program' : 'Add New Program'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Code *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="BTECH"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Bachelor of Technology"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Short Name *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  required
                  placeholder="B.Tech"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Campus *</label>
                <select
                  className="glass-input"
                  value={formData.campus}
                  onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Campus</option>
                  {campuses.map(campus => (
                    <option key={campus._id} value={campus._id}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Level *</label>
                <select
                  className="glass-input"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Duration (Years) *</label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.duration.years}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    duration: { 
                      years: parseInt(e.target.value), 
                      semesters: parseInt(e.target.value) * 2 
                    } 
                  })}
                  required
                  min={1}
                  max={10}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Total Semesters *</label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.duration.semesters}
                  onChange={(e) => setFormData({ ...formData, duration: { ...formData.duration, semesters: parseInt(e.target.value) } })}
                  required
                  min={1}
                  max={20}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Eligibility Criteria</label>
              <textarea
                className="glass-input"
                value={formData.eligibilityCriteria}
                onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })}
                placeholder="E.g., 10+2 with 60% in PCM"
                rows={2}
                style={{ width: '100%', padding: '0.5rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Description</label>
              <textarea
                className="glass-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Program description..."
                rows={3}
                style={{ width: '100%', padding: '0.5rem', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className="glass-button"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Program' : 'Create Program')}
            </button>
          </form>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {programs.map((program) => (
          <motion.div
            key={program._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card"
            style={{ padding: '1.5rem' }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <h3 style={{ color: 'white', margin: 0 }}>{program.shortName}</h3>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6'
                }}>
                  {program.code}
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{program.name}</div>
              {program.campus && (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  🏫 {program.campus.name}
                </div>
              )}
            </div>

            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div>📊 Level: {program.level.charAt(0).toUpperCase() + program.level.slice(1)}</div>
              <div>⏱️ Duration: {program.duration.years} years ({program.duration.semesters} semesters)</div>
              {program.eligibilityCriteria && <div>📝 {program.eligibilityCriteria}</div>}
            </div>

            {program.description && (
              <div style={{ 
                color: 'rgba(255,255,255,0.6)', 
                fontSize: '0.85rem', 
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                maxHeight: '60px',
                overflow: 'auto'
              }}>
                {program.description}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleEdit(program)}
                className="glass-button"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(program._id)}
                className="glass-button"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(255, 107, 107, 0.2)' }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && programs.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
          <h3>No programs created yet</h3>
          <p>Click "Add Program" to create your first academic program</p>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;