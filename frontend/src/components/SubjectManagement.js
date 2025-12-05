import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import api from '../utils/api';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [faculty, setFaculty] = useState([]); // Add faculty state
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    branch: '', // Changed from university/school/campus/program/branch/batch to just branch
    section: '',
    semester: '',
    credits: 3,
    type: 'core',
    faculty: [{ teacher: '', role: 'primary', assignedSections: [''] }],
    timetable: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '', section: '' }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, branchesRes, facultyRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/branches?isActive=true'),
        api.get('/users?role=admin') // Fetch faculty (admins)
      ]);
      setSubjects(subjectsRes.data);
      setBranches(branchesRes.data);
      setFaculty(facultyRes.data); // Set faculty data
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Find the branch object to get the code
      const selectedBranch = branches.find(branch => branch._id === formData.branch);
      const branchCode = selectedBranch ? selectedBranch.code : formData.branch;

      // Prepare data to match backend expectations
      const submitData = {
        code: formData.code,
        name: formData.name,
        shortName: formData.shortName,
        department: branchCode, // Use branch code, not ID
        semester: parseInt(formData.semester),
        credits: parseInt(formData.credits),
        section: formData.section || null
      };

      // Add faculty if selected
      if (formData.faculty[0]?.teacher) {
        submitData.faculty = formData.faculty[0].teacher;
      }

      // Add timetable if exists
      if (formData.timetable && formData.timetable.length > 0) {
        submitData.timetable = formData.timetable;
      }

      const url = editingSubject ? `/subjects/${editingSubject._id}` : '/subjects';
      const method = editingSubject ? 'put' : 'post';
      await api[method](url, submitData);
      
      setShowForm(false);
      setEditingSubject(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert(`Error: ${error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save subject'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    setLoading(true);
    try {
      await api.delete(`/subjects/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to delete subject'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this subject? This action cannot be undone and will remove all related attendance records.')) return;
    setLoading(true);
    try {
      await api.delete(`/subjects/${id}?permanent=true`);
      fetchData();
    } catch (error) {
      console.error('Error permanently deleting subject:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to permanently delete subject'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code || '',
      name: subject.name || '',
      shortName: subject.shortName || '',
      branch: subject.branch?._id || subject.branch || '', // Changed to branch
      section: subject.section || '',
      semester: subject.semester || '',
      credits: subject.credits || 3,
      type: subject.type || 'core',
      faculty: subject.faculty || [{ teacher: '', role: 'primary', assignedSections: [''] }],
      timetable: subject.timetable || [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '', section: '' }]
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingSubject(null);
    setFormData({
      code: '',
      name: '',
      shortName: '',
      branch: '', // Changed from university/school/campus/program/branch/batch to just branch
      section: '',
      semester: '',
      credits: 3,
      type: 'core',
      faculty: [{ teacher: '', role: 'primary', assignedSections: [''] }],
      timetable: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '', section: '' }]
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFacultyChange = (index, field, value) => {
    const updatedFaculty = [...formData.faculty];
    updatedFaculty[index][field] = value;
    setFormData(prev => ({
      ...prev,
      faculty: updatedFaculty
    }));
  };

  const handleTimetableChange = (index, field, value) => {
    const updatedTimetable = [...formData.timetable];
    updatedTimetable[index][field] = value;
    setFormData(prev => ({
      ...prev,
      timetable: updatedTimetable
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Subject Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingSubject(null);
            setFormData({
              code: '',
              name: '',
              shortName: '',
              university: '',
              school: '',
              campus: '',
              program: '',
              branch: '',
              batch: '',
              section: '',
              semester: '',
              credits: 3,
              type: 'core',
              faculty: [{ teacher: '', role: 'primary', assignedSections: [''] }],
              timetable: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '', section: '' }]
            });
            setShowForm(!showForm);
          }}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Add Subject'}
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
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
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
                placeholder="SUBJ101"
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
                placeholder="Subject Name"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Short Name</label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                className="glass-input"
                placeholder="Subj"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Branch *</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                className="glass-input"
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Semester *</label>
              <input
                type="number"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
                min="1"
                max="8"
                className="glass-input"
                placeholder="1"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Credits</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                min="1"
                max="6"
                className="glass-input"
                placeholder="3"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="glass-input"
                placeholder="A"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Faculty</label>
              <select
                name="faculty"
                value={formData.faculty[0]?.teacher || ''}
                onChange={(e) => handleFacultyChange(0, 'teacher', e.target.value)}
                className="glass-input"
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Select Faculty (Optional)</option>
                {faculty.map(facultyMember => (
                  <option key={facultyMember._id} value={facultyMember._id}>
                    {facultyMember.name} ({facultyMember.email})
                  </option>
                ))}
              </select>
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
                {loading ? 'Saving...' : editingSubject ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <GlassCard className="p-6">
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Subjects</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        
        {!loading && subjects.length === 0 && (
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
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No subjects created yet</h3>
              <p style={{ margin: 0 }}>Click "Add Subject" to create your first subject</p>
            </div>
          </div>
        )}
        
        {!loading && subjects.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {subjects.map((subject) => (
              <motion.div
                key={subject._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'white', margin: 0, marginBottom: '0.25rem' }}>{subject.name}</h3>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      Code: {subject.code}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: subject.isActive ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    color: subject.isActive ? '#4cd137' : '#ff6b6b'
                  }}>
                    {subject.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {subject.branch && <div>📚 {subject.branch.name} ({subject.branch.code})</div>}
                  <div>📊 Semester: {subject.semester}</div>
                  <div>🏅 Credits: {subject.credits}</div>
                  <div>🏷️ Type: {subject.type?.charAt(0).toUpperCase() + subject.type?.slice(1)}</div>
                  {subject.faculty && <div>👨‍🏫 Faculty: {subject.faculty.name}</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(subject)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(subject._id)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(255, 107, 107, 0.2)' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(subject._id)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(150, 0, 0, 0.3)' }}
                  >
                    Perm.
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

export default SubjectManagement;