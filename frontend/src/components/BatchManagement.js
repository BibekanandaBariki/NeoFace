import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import '../styles/glassmorphism.css';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    admissionYear: new Date().getFullYear(),
    passOutYear: new Date().getFullYear() + 4,
    program: '',
    branch: '',
    campus: '',
    numberOfSections: 1,
    sections: ['A']
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.numberOfSections) {
      const sections = [];
      for (let i = 0; i < formData.numberOfSections; i++) {
        sections.push(String.fromCharCode(65 + i)); // A, B, C, ...
      }
      setFormData(prev => ({ ...prev, sections }));
    }
  }, [formData.numberOfSections]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, campusesRes, programsRes, branchesRes] = await Promise.all([
        api.get('/api/batches'),
        api.get('/api/campus'),
        api.get('/api/programs'),
        api.get('/api/branches')
      ]);
      setBatches(batchesRes.data);
      setCampuses(campusesRes.data);
      setPrograms(programsRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      setError('Failed to fetch data');
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
      const submitData = {
        ...formData,
        year: `${formData.admissionYear}-${formData.passOutYear}`
      };

      if (editingId) {
        await api.put(`/api/batches/${editingId}`, submitData);
        setSuccess('Batch updated successfully!');
      } else {
        await api.post('/api/batches', submitData);
        setSuccess('Batch created successfully!');
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} batch`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch) => {
    setEditingId(batch._id);
    setFormData({
      admissionYear: batch.admissionYear,
      passOutYear: batch.passOutYear,
      program: batch.program._id || batch.program,
      branch: batch.branch._id || batch.branch,
      campus: batch.campus._id || batch.campus,
      numberOfSections: batch.numberOfSections,
      sections: batch.sections
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;

    try {
      await api.delete(`/api/batches/${id}`);
      setSuccess('Batch deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete batch');
    }
  };

  const resetForm = () => {
    setFormData({
      admissionYear: new Date().getFullYear(),
      passOutYear: new Date().getFullYear() + 4,
      program: '',
      branch: '',
      campus: '',
      numberOfSections: 1,
      sections: ['A']
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Filter branches based on selected campus and program
  const filteredBranches = branches.filter(b => 
    (!formData.campus || b.campus._id === formData.campus || b.campus === formData.campus) &&
    (!formData.program || b.program._id === formData.program || b.program === formData.program)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Batch Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Add Batch'}
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
            {editingId ? 'Edit Batch' : 'Add New Batch'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Admission Year *</label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.admissionYear}
                  onChange={(e) => setFormData({ ...formData, admissionYear: parseInt(e.target.value) })}
                  required
                  min={2000}
                  max={2100}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Pass Out Year *</label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.passOutYear}
                  onChange={(e) => setFormData({ ...formData, passOutYear: parseInt(e.target.value) })}
                  required
                  min={formData.admissionYear + 1}
                  max={2100}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Campus *</label>
                <select
                  className="glass-input"
                  value={formData.campus}
                  onChange={(e) => setFormData({ ...formData, campus: e.target.value, branch: '' })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Campus</option>
                  {campuses.filter(c => c.isActive).map(campus => (
                    <option key={campus._id} value={campus._id}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Program *</label>
                <select
                  className="glass-input"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value, branch: '' })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Program</option>
                  {programs.filter(p => p.isActive).map(program => (
                    <option key={program._id} value={program._id}>{program.shortName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Branch *</label>
                <select
                  className="glass-input"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  required
                  disabled={!formData.campus || !formData.program}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Branch</option>
                  {filteredBranches.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.shortName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Number of Sections *</label>
              <input
                type="number"
                className="glass-input"
                value={formData.numberOfSections}
                onChange={(e) => setFormData({ ...formData, numberOfSections: parseInt(e.target.value) })}
                required
                min={1}
                max={10}
                style={{ width: '100%', padding: '0.5rem' }}
              />
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Sections: {formData.sections.join(', ')}
              </div>
            </div>

            <button
              type="submit"
              className="glass-button"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Batch' : 'Create Batch')}
            </button>
          </form>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {batches.map((batch) => (
          <motion.div
            key={batch._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card"
            style={{ padding: '1.5rem' }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <h3 style={{ color: 'white', margin: 0 }}>{batch.year}</h3>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  background: batch.isActive ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                  color: batch.isActive ? '#4cd137' : '#ff6b6b'
                }}>
                  {batch.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                {batch.branch?.shortName || 'N/A'} - {batch.program?.shortName || 'N/A'}
              </div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div>🏫 {batch.campus?.name || 'N/A'}</div>
              <div>📚 Current Semester: {batch.currentSemester}</div>
              <div>👥 Students: {batch.totalStudents}</div>
              <div>📋 Sections: {batch.sections.join(', ')} ({batch.numberOfSections})</div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleEdit(batch)}
                className="glass-button"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(batch._id)}
                className="glass-button"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(255, 107, 107, 0.2)' }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && batches.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
          <h3>No batches created yet</h3>
          <p>Click "Add Batch" to create your first student batch</p>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
