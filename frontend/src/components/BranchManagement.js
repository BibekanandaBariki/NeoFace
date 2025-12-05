import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import GlassCard from './GlassCard';
import '../styles/glassmorphism.css';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    university: '',
    campus: '',
    school: '',
    program: '',
    course: '',
    intake: 60,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        branchesRes,
        campusesRes,
        programsRes,
        coursesRes,
        universitiesRes,
        schoolsRes
      ] = await Promise.all([
        api.get('/branches'),
        api.get('/campus?isActive=true'),
        api.get('/programs?isActive=true'),
        api.get('/courses?isActive=true'),
        api.get('/universities?isActive=true'),
        api.get('/schools?isActive=true')
      ]);
      setBranches(branchesRes.data);
      setCampuses(campusesRes.data);
      setPrograms(programsRes.data);
      setCourses(coursesRes.data);
      setUniversities(universitiesRes.data);
      setSchools(schoolsRes.data);
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
      if (editingId) {
        await api.put(`/api/branches/${editingId}`, formData);
        setSuccess('Branch updated successfully!');
      } else {
        await api.post('/branches', formData);
        setSuccess('Branch created successfully!');
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} branch`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setEditingId(branch._id);
    setFormData({
      code: branch.code,
      name: branch.name,
      shortName: branch.shortName,
      university: branch.university?._id || branch.university,
      campus: branch.campus?._id || branch.campus,
      school: branch.school?._id || branch.school,
      program: branch.program?._id || branch.program,
      course: branch.course?._id || branch.course,
      intake: branch.intake,
      description: branch.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;

    try {
      await api.delete(`/api/branches/${id}`);
      setSuccess('Branch deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete branch');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      shortName: '',
      university: '',
      campus: '',
      school: '',
      program: '',
      course: '',
      intake: 60,
      description: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Branch Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Add Branch'}
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
            {editingId ? 'Edit Branch' : 'Add New Branch'}
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
                  placeholder="CSE"
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
                  placeholder="Computer Science and Engineering"
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
                  placeholder="CSE"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>University *</label>
                <select
                  className="glass-input"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value, campus: '', school: '', program: '', course: '' })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select University</option>
                  {universities.map(uni => (
                    <option key={uni._id} value={uni._id}>{uni.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Campus *</label>
                <select
                  className="glass-input"
                  value={formData.campus}
                  onChange={(e) => setFormData({ ...formData, campus: e.target.value, school: '', program: '', course: '' })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Campus</option>
                  {campuses.filter(c => c.university?._id === formData.university).map(campus => (
                    <option key={campus._id} value={campus._id}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>School *</label>
                <select
                  className="glass-input"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value, program: '', course: '' })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select School</option>
                  {schools.filter(s => s.campus?._id === formData.campus).map(school => (
                    <option key={school._id} value={school._id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Program *</label>
                <select
                  className="glass-input"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value, course: '' })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Program</option>
                  {programs.filter(p => p.school?._id === formData.school).map(program => (
                    <option key={program._id} value={program._id}>{program.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Course *</label>
                <select
                  className="glass-input"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Course</option>
                  {courses.filter(c => c.program?._id === formData.program).map(course => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Intake</label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.intake}
                  onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
                  placeholder="60"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Description</label>
              <textarea
                className="glass-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Branch description..."
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
              {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Branch' : 'Create Branch')}
            </button>
          </form>
        </motion.div>
      )}
      
      <GlassCard className="p-6">
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Branches</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        
        {!loading && branches.length === 0 && (
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
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No branches created yet</h3>
              <p style={{ margin: 0 }}>Click "Add Branch" to create your first branch</p>
            </div>
          </div>
        )}
        
        {!loading && branches.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {branches.map((branch) => (
              <motion.div
                key={branch._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ color: 'white', margin: 0, marginBottom: '0.25rem' }}>{branch.shortName}</h3>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        Code: {branch.code}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      background: branch.isActive ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                      color: branch.isActive ? '#4cd137' : '#ff6b6b'
                    }}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{branch.name}</div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <div>🏫 {branch.campus?.name || 'N/A'}</div>
                  <div>📚 {branch.program?.shortName || 'N/A'}</div>
                  <div>👥 Intake: {branch.intake} students</div>
                </div>

                {branch.description && (
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
                    {branch.description}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(branch)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(branch._id)}
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

export default BranchManagement;
