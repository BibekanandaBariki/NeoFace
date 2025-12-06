import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import GlassCard from './GlassCard';

const UniversityManagement = () => {
  const [universities, setUniversities] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    isActive: true
  });

  const fetchUniversities = async () => {
    try {
      const response = await api.get('/universities');
      setUniversities(response.data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/universities/${formData._id}`, formData);
      } else {
        await api.post('/universities', formData);
      }
      setShowAddForm(false);
      setFormData({
        name: '',
        code: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        isActive: true
      });
      fetchUniversities();
    } catch (error) {
      console.error('Error saving university:', error);
    }
  };

  const handleEdit = (university) => {
    setFormData(university);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this university?')) return;
    
    try {
      await api.delete(`/universities/${id}`);
      fetchUniversities();
    } catch (error) {
      console.error('Error deleting university:', error);
    }
  };

  return (
    <div className="university-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white' }}>University Management</h2>
        <button 
          className="glass-button"
          onClick={() => {
            setFormData({
              name: '',
              code: '',
              address: '',
              contactEmail: '',
              contactPhone: '',
              website: '',
              isActive: true
            });
            setShowAddForm(!showAddForm);
          }}
        >
          {showAddForm ? 'Cancel' : 'Add University'}
        </button>
      </div>

      {showAddForm ? (
        <GlassCard>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  University Name
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  University Code
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  className="glass-input"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                />
              </div>
              
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  className="glass-input"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Address
                </label>
                <textarea
                  className="glass-input"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="2"
                />
              </div>
              
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Website
                </label>
                <input
                  type="url"
                  className="glass-input"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  style={{ marginRight: '0.5rem' }}
                />
                Active
              </label>
            </div>
            
            <button type="submit" className="glass-button">
              Save University
            </button>
          </form>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {universities.map(university => (
            <GlassCard key={university._id}>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{university.name}</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                Code: {university.code}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                {university.address}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ color: university.isActive ? '#4CAF50' : '#f44336' }}>
                  {university.isActive ? 'Active' : 'Inactive'}
                </span>
                <div>
                  <button 
                    className="glass-button glass-button-secondary"
                    onClick={() => handleEdit(university)}
                    style={{ marginRight: '0.5rem' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="glass-button glass-button-danger"
                    onClick={() => handleDelete(university._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniversityManagement;