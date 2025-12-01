import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import GlassCard from './GlassCard';

const SchoolManagement = () => {
  const [schools, setSchools] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    fullName: '',
    university: '',
    campus: '',
    description: '',
    hod: '',
    establishedYear: ''
  });

  useEffect(() => {
    fetchSchools();
    fetchUniversities();
    fetchCampuses();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/schools');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const response = await api.get('/api/universities?isActive=true');
      setUniversities(response.data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const fetchCampuses = async () => {
    try {
      const response = await api.get('/api/campus?isActive=true');
      setCampuses(response.data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingSchool) {
        await api.put(`/api/schools/${editingSchool._id}`, formData);
      } else {
        await api.post('/api/schools', formData);
      }
      
      setShowForm(false);
      setEditingSchool(null);
      setFormData({
        code: '',
        name: '',
        fullName: '',
        university: '',
        campus: '',
        description: '',
        hod: '',
        establishedYear: ''
      });
      fetchSchools();
    } catch (error) {
      console.error('Error saving school:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this school? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      await api.delete(`/api/schools/${id}?permanent=true`);
      fetchSchools();
    } catch (error) {
      console.error('Error deleting school:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      code: school.code || '',
      name: school.name || '',
      fullName: school.fullName || '',
      university: school.university?._id || school.university || '',
      campus: school.campus?._id || school.campus || '',
      description: school.description || '',
      hod: school.hod?._id || school.hod || '',
      establishedYear: school.establishedYear || ''
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>School Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingSchool(null);
            setFormData({
              code: '',
              name: '',
              fullName: '',
              university: '',
              campus: '',
              description: '',
              hod: '',
              establishedYear: ''
            });
            setShowForm(!showForm);
          }}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Add School'}
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
            {editingSchool ? 'Edit School' : 'Add New School'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="glass-input"
                placeholder="SCHOOL"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="glass-input"
                placeholder="School Name"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="glass-input"
                placeholder="Full School Name"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>University *</label>
              <select
                name="university"
                value={formData.university}
                onChange={handleChange}
                required
                className="glass-input"
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Select University</option>
                {universities.map(university => (
                  <option key={university._id} value={university._id}>
                    {university.name} ({university.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Campus *</label>
              <select
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                required
                className="glass-input"
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Select Campus</option>
                {campuses
                  .filter(campus => !formData.university || campus.university?._id === formData.university)
                  .map(campus => (
                    <option key={campus._id} value={campus._id}>
                      {campus.name} ({campus.code})
                    </option>
                  ))}
              </select>
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
            
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="glass-input"
                placeholder="School description"
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
                {loading ? 'Saving...' : editingSchool ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <GlassCard className="p-6">
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Schools</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        
        {!loading && schools.length === 0 && (
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
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No schools created yet</h3>
              <p style={{ margin: 0 }}>Click "Add School" to create your first school</p>
            </div>
          </div>
        )}
        
        {!loading && schools.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {schools.map((school) => (
              <motion.div
                key={school._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'white', margin: 0, marginBottom: '0.25rem' }}>{school.name}</h3>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      Code: {school.code}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: school.isActive ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    color: school.isActive ? '#4cd137' : '#ff6b6b'
                  }}>
                    {school.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {school.university && <div>🏫 {school.university.name} ({school.university.code})</div>}
                  {school.campus && <div>📍 {school.campus.name} ({school.campus.code})</div>}
                  {school.description && <div>📝 {school.description}</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(school)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(school._id)}
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

export default SchoolManagement;