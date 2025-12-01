import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import GlassCard from './GlassCard';
import '../styles/glassmorphism.css';

const CampusManagement = () => {
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    university: '', // Add university field
    location: {
      address: '',
      city: '',
      state: 'Odisha',
      pincode: ''
    },
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    establishedYear: new Date().getFullYear()
  });

  const [universities, setUniversities] = useState([]); // Add universities state

  useEffect(() => {
    fetchCampuses();
    fetchUniversities(); // Fetch universities on component mount
  }, []);

  const fetchCampuses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/campus');
      setCampuses(response.data);
    } catch (err) {
      setError('Failed to fetch campuses');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const response = await api.get('/api/universities?isActive=true');
      setUniversities(response.data);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Debug logging
    console.log('Submitting campus form data:', formData);
    console.log('University ID:', formData.university);

    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/api/campus/${editingId}`, formData);
        setSuccess('Campus updated successfully!');
      } else {
        await api.post('/api/campus', formData);
        setSuccess('Campus created successfully!');
      }
      resetForm();
      fetchCampuses();
    } catch (err) {
      console.error('Campus creation error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} campus`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (campus) => {
    setEditingId(campus._id);
    setFormData({
      code: campus.code,
      name: campus.name,
      university: campus.university?._id || '', // Add university field
      location: campus.location || { address: '', city: '', state: 'Odisha', pincode: '' },
      contactInfo: campus.contactInfo || { phone: '', email: '', website: '' },
      establishedYear: campus.establishedYear || new Date().getFullYear()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this campus? This action cannot be undone.')) return;

    try {
      await api.delete(`/api/campus/${id}?permanent=true`);
      setSuccess('Campus deleted permanently!');
      fetchCampuses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete campus');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`/api/campus/${id}/toggle-active`, { isActive: !currentStatus });
      setSuccess(`Campus ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      fetchCampuses();
    } catch (err) {
      setError('Failed to update campus status');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      university: '', // Reset university field
      location: { address: '', city: '', state: 'Odisha', pincode: '' },
      contactInfo: { phone: '', email: '', website: '' },
      establishedYear: new Date().getFullYear()
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Campus Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Add Campus'}
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
            {editingId ? 'Edit Campus' : 'Add New Campus'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Campus Code *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                  placeholder="PLK, BBS, etc."
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Campus Name *</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Paralakhemundi Campus"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>University *</label>
              <select
                className="glass-input"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Select University</option>
                {universities.map((university) => (
                  <option key={university._id} value={university._id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Address</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.location.address}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                  placeholder="Street address"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>City</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.location.city}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                  placeholder="City name"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Pincode</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.location.pincode}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, pincode: e.target.value } })}
                  placeholder="761211"
                  maxLength={6}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Phone</label>
                <input
                  type="tel"
                  className="glass-input"
                  value={formData.contactInfo.phone}
                  onChange={(e) => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, phone: e.target.value } })}
                  placeholder="1234567890"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <input
                  type="email"
                  className="glass-input"
                  value={formData.contactInfo.email}
                  onChange={(e) => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, email: e.target.value } })}
                  placeholder="campus@university.edu"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Website</label>
                <input
                  type="url"
                  className="glass-input"
                  value={formData.contactInfo.website}
                  onChange={(e) => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, website: e.target.value } })}
                  placeholder="https://campus.edu"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Established</label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.establishedYear}
                  onChange={(e) => setFormData({ ...formData, establishedYear: parseInt(e.target.value) })}
                  min={1900}
                  max={new Date().getFullYear()}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="glass-button"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Campus' : 'Create Campus')}
            </button>
          </form>
        </motion.div>
      )}

      <GlassCard className="p-6">
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Campuses</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        
        {!loading && campuses.length === 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '3rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            margin: '1rem 0'
          }}>
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255,255,255,0.7)',
              padding: '2rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No campuses created yet</h3>
              <p style={{ margin: 0 }}>Click "Add Campus" to create your first campus</p>
            </div>
          </div>
        )}
        
        {!loading && campuses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {campuses.map((campus) => (
              <motion.div
                key={campus._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'white', margin: 0, marginBottom: '0.25rem' }}>{campus.name}</h3>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Code: {campus.code}</div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: campus.isActive ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    color: campus.isActive ? '#4cd137' : '#ff6b6b'
                  }}>
                    {campus.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {campus.location?.city && <div>📍 {campus.location.city}, {campus.location.state}</div>}
                  {campus.contactInfo?.phone && <div>📞 {campus.contactInfo.phone}</div>}
                  {campus.contactInfo?.email && <div>📧 {campus.contactInfo.email}</div>}
                  {campus.establishedYear && <div>📅 Est. {campus.establishedYear}</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(campus)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(campus._id, campus.isActive)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(251, 197, 49, 0.2)' }}
                  >
                    {campus.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(campus._id)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(255, 107, 107, 0.2)' }}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
      
    </div>
  );
};

export default CampusManagement;
