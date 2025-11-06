import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
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

  useEffect(() => {
    fetchCampuses();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      location: campus.location || { address: '', city: '', state: 'Odisha', pincode: '' },
      contactInfo: campus.contactInfo || { phone: '', email: '', website: '' },
      establishedYear: campus.establishedYear || new Date().getFullYear()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campus?')) return;

    try {
      await api.delete(`/api/campus/${id}`);
      setSuccess('Campus deleted successfully!');
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

      {!loading && campuses.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
          <h3>No campuses created yet</h3>
          <p>Click "Add Campus" to create your first campus</p>
        </div>
      )}
    </div>
  );
};

export default CampusManagement;
