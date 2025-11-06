import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import '../styles/glassmorphism.css';

const SemesterManagement = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    semesterNumber: 1,
    academicYear: '',
    branch: '',
    section: '',
    startDate: '',
    endDate: '',
    holidays: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/semesters');
      setSemesters(response.data);
    } catch (err) {
      setError('Failed to load semesters');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/api/semesters/${editingId}`, formData);
        setSuccess('Semester updated successfully!');
      } else {
        await api.post('/api/semesters', formData);
        setSuccess('Semester created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        semesterNumber: 1,
        academicYear: '',
        branch: '',
        section: '',
        startDate: '',
        endDate: '',
        holidays: []
      });
      fetchSemesters();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} semester`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (semester) => {
    setEditingId(semester._id);
    setFormData({
      name: semester.name,
      semesterNumber: semester.semesterNumber,
      academicYear: semester.academicYear,
      branch: semester.branch,
      section: semester.section || '',
      startDate: semester.startDate ? semester.startDate.split('T')[0] : '',
      endDate: semester.endDate ? semester.endDate.split('T')[0] : '',
      holidays: semester.holidays || []
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      semesterNumber: 1,
      academicYear: '',
      branch: '',
      section: '',
      startDate: '',
      endDate: '',
      holidays: []
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this semester?')) return;

    try {
      await api.delete(`/api/semesters/${id}`);
      setSuccess('Semester deleted successfully');
      fetchSemesters();
    } catch (err) {
      setError('Failed to delete semester');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/api/semesters/${id}`, { isActive: !currentStatus });
      setSuccess('Semester status updated');
      fetchSemesters();
    } catch (err) {
      setError('Failed to update semester status');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>Semester Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => showForm ? handleCancelEdit() : setShowForm(true)}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Create Semester'}
        </motion.button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255, 107, 107, 0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', background: 'rgba(76, 209, 55, 0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#4cd137' }}>
          {success}
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ marginBottom: '2rem' }}
        >
          <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>{editingId ? 'Edit Semester' : 'Create New Semester'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Semester Name
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fall 2024"
                  required
                />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Semester Number (1-8)
                </label>
                <input
                  type="number"
                  className="glass-input"
                  min="1"
                  max="8"
                  value={formData.semesterNumber}
                  onChange={(e) => setFormData({ ...formData, semesterNumber: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Academic Year
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="e.g., 2024-2025"
                  required
                />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Branch
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g., CSE, ECE"
                  required
                />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Section (Optional)
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g., A, B"
                />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  className="glass-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  End Date
                </label>
                <input
                  type="date"
                  className="glass-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="glass-button"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Semester' : 'Create Semester')}
            </button>
          </form>
        </motion.div>
      )}

      {/* Semesters List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {loading && semesters.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>
            Loading semesters...
          </div>
        ) : semesters.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>
            No semesters found. Create one to get started!
          </div>
        ) : (
          semesters.map((semester) => (
            <motion.div
              key={semester._id}
              whileHover={{ scale: 1.02 }}
              className="glass-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}>{semester.name}</h3>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      background: semester.isActive ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                      color: semester.isActive ? '#4cd137' : '#ff6b6b'
                    }}>
                      {semester.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Academic Year</div>
                      <div style={{ color: 'white' }}>{semester.academicYear}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Branch/Section</div>
                      <div style={{ color: 'white' }}>{semester.branch}{semester.section ? ` - ${semester.section}` : ''}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Semester</div>
                      <div style={{ color: 'white' }}>Semester {semester.semesterNumber}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Duration</div>
                      <div style={{ color: 'white', fontSize: '0.9rem' }}>
                        {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <button
                    onClick={() => handleEdit(semester)}
                    className="glass-button"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(semester._id, semester.isActive)}
                    className="glass-button"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    {semester.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(semester._id)}
                    className="glass-button"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(255, 107, 107, 0.2)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default SemesterManagement;
