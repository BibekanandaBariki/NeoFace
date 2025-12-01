import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import api from '../utils/api';

const UniversityManagement = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    },
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    establishedYear: '',
    accreditation: ''
  });

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/universities?isActive=true');
      setUniversities(response.data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debug: Log the exact data being sent
    console.log('Submitting university data:', formData);
    console.log('Name field:', formData.name);
    console.log('Code field:', formData.code);
    
    try {
      setLoading(true);
      if (editingUniversity) {
        await api.put(`/api/universities/${editingUniversity._id}`, formData);
      } else {
        await api.post('/api/universities', formData);
      }
      
      setShowForm(false);
      setEditingUniversity(null);
      setFormData({
        name: '',
        code: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          pincode: ''
        },
        contactInfo: {
          phone: '',
          email: '',
          website: ''
        },
        establishedYear: '',
        accreditation: ''
      });
      fetchUniversities();
    } catch (error) {
      console.error('Error saving university:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this university? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      await api.delete(`/api/universities/${id}?permanent=true`);
      fetchUniversities();
    } catch (error) {
      console.error('Error deleting university:', error);
      // Show error to user
      alert('Error deleting university: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (university) => {
    setEditingUniversity(university);
    setFormData({
      name: university.name || '',
      code: university.code || '',
      address: {
        street: university.address?.street || '',
        city: university.address?.city || '',
        state: university.address?.state || '',
        country: university.address?.country || '',
        pincode: university.address?.pincode || ''
      },
      contactInfo: {
        phone: university.contactInfo?.phone || '',
        email: university.contactInfo?.email || '',
        website: university.contactInfo?.website || ''
      },
      establishedYear: university.establishedYear || '',
      accreditation: university.accreditation || ''
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log('handleChange called:', name, '=', value); // Debug log
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>University Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingUniversity(null);
            setFormData({
              name: '',
              code: '',
              address: {
                street: '',
                city: '',
                state: '',
                country: '',
                pincode: ''
              },
              contactInfo: {
                phone: '',
                email: '',
                website: ''
              },
              establishedYear: '',
              accreditation: ''
            });
            setShowForm(!showForm);
          }}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Add University'}
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: '1.5rem', marginBottom: '2rem' }}
        >
          <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>
            {editingUniversity ? 'Edit University' : 'Add New University'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="glass-input"
                placeholder="University Name"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="glass-input"
                placeholder="UNIV"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Established Year</label>
              <input
                type="number"
                name="establishedYear"
                value={formData.establishedYear}
                onChange={handleChange}
                className="glass-input"
                placeholder="2010"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Accreditation</label>
              <input
                type="text"
                name="accreditation"
                value={formData.accreditation}
                onChange={handleChange}
                className="glass-input"
                placeholder="A+"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Street</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="glass-input"
                placeholder="Street Address"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>City</label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="glass-input"
                placeholder="City"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>State</label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="glass-input"
                placeholder="State"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Country</label>
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                className="glass-input"
                placeholder="Country"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Pincode</label>
              <input
                type="text"
                name="address.pincode"
                value={formData.address.pincode}
                onChange={handleChange}
                className="glass-input"
                placeholder="123456"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Phone</label>
              <input
                type="text"
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={handleChange}
                className="glass-input"
                placeholder="1234567890"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                name="contactInfo.email"
                value={formData.contactInfo.email}
                onChange={handleChange}
                className="glass-input"
                placeholder="admin@university.edu"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Website</label>
              <input
                type="url"
                name="contactInfo.website"
                value={formData.contactInfo.website}
                onChange={handleChange}
                className="glass-input"
                placeholder="https://university.edu"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="glass-button"
                style={{ padding: '0.5rem 1rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="glass-button"
                style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
              >
                {loading ? 'Saving...' : editingUniversity ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <GlassCard className="p-6">
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Universities</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        
        {!loading && universities.length === 0 && (
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
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No universities created yet</h3>
              <p style={{ margin: 0 }}>Click "Add University" to create your first university</p>
            </div>
          </div>
        )}
        
        {!loading && universities.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {universities.map((university) => (
              <motion.div
                key={university._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'white', margin: 0, marginBottom: '0.25rem' }}>{university.name}</h3>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      Code: {university.code}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: university.isActive ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    color: university.isActive ? '#4cd137' : '#ff6b6b'
                  }}>
                    {university.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {university.address?.city && <div>📍 {university.address.city}, {university.address.state}</div>}
                  {university.contactInfo?.phone && <div>📞 {university.contactInfo.phone}</div>}
                  {university.contactInfo?.email && <div>📧 {university.contactInfo.email}</div>}
                  {university.establishedYear && <div>📅 Est. {university.establishedYear}</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(university)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(university._id)}
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

export default UniversityManagement;