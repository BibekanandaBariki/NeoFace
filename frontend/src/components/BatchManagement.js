import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import GlassCard from './GlassCard';
import '../styles/glassmorphism.css';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    admissionYear: new Date().getFullYear(),
    passOutYear: new Date().getFullYear() + 4,
    universityId: '',
    campusId: '',
    schoolId: '',
    programId: '',
    courseId: '',
    branchId: '',
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
      const [batchesRes, campusesRes, programsRes, branchesRes, universitiesRes, schoolsRes, coursesRes] = await Promise.all([
        api.get('/api/batches'),
        api.get('/api/campus?isActive=true'),
        api.get('/api/programs?isActive=true'),
        api.get('/api/branches?isActive=true'),
        api.get('/api/universities?isActive=true'),
        api.get('/api/schools?isActive=true'),
        api.get('/api/courses?isActive=true')
      ]);
      setBatches(batchesRes.data);
      setCampuses(campusesRes.data);
      setPrograms(programsRes.data);
      setBranches(branchesRes.data);
      setUniversities(universitiesRes.data);
      setSchools(schoolsRes.data);
      setCourses(coursesRes.data);
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
        admissionYear: formData.admissionYear,
        passOutYear: formData.passOutYear,
        university: formData.universityId,
        campus: formData.campusId,
        school: formData.schoolId,
        program: formData.programId,
        course: formData.courseId,
        branch: formData.branchId,
        numberOfSections: formData.numberOfSections,
        sections: formData.sections,
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
      universityId: batch.university?._id || batch.university,
      campusId: batch.campus?._id || batch.campus,
      schoolId: batch.school?._id || batch.school,
      programId: batch.program?._id || batch.program,
      courseId: batch.course?._id || batch.course,
      branchId: batch.branch?._id || batch.branch,
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
      universityId: '',
      schoolId: '',
      courseId: '',
      programId: '',
      branchId: '',
      campusId: '',
      numberOfSections: 1,
      sections: ['A']
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Filter branches based on selected campus and program
  const filteredPrograms = programs.filter(p => 
    (!formData.campusId || (p.campus?._id || p.campus) === formData.campusId) &&
    (!formData.schoolId || (p.school?._id || p.school) === formData.schoolId)
  );

  const filteredBranches = branches.filter(b => 
    (!formData.campusId || (b.campus?._id || b.campus) === formData.campusId) &&
    (!formData.programId || (b.program?._id || b.program) === formData.programId)
  );

  const filteredCourses = courses.filter(c =>
    (!formData.programId || (c.program?._id || c.program) === formData.programId)
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
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>University *</label>
                <select
                  className="glass-input"
                  value={formData.universityId}
                  onChange={(e) => setFormData({ ...formData, universityId: e.target.value, campusId: '', schoolId: '', programId: '', courseId: '', branchId: '' })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select University</option>
                  {universities.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>School *</label>
                <select
                  className="glass-input"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value, programId: '', courseId: '', branchId: '' })}
                  required
                  disabled={!formData.campusId}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select School</option>
                  {schools.filter(s => (s.campus?._id || s.campus) === formData.campusId).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Campus *</label>
                <select
                  className="glass-input"
                  value={formData.campusId}
                  onChange={(e) => setFormData({ ...formData, campusId: e.target.value, schoolId: '', programId: '', courseId: '', branchId: '' })}
                  required
                  disabled={!formData.universityId}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Campus</option>
                  {campuses.filter(c => (c.university?._id || c.university) === formData.universityId).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Program *</label>
                <select
                  className="glass-input"
                  value={formData.programId}
                  onChange={(e) => setFormData({ ...formData, programId: e.target.value, courseId: '', branchId: '' })}
                  required
                  disabled={!formData.campusId || !formData.schoolId}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Program</option>
                  {filteredPrograms.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Course *</label>
                <select
                  className="glass-input"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value, branchId: '' })}
                  required
                  disabled={!formData.programId}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Course</option>
                  {filteredCourses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Branch *</label>
                <select
                  className="glass-input"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  required
                  disabled={!formData.courseId}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Branch</option>
                  {filteredBranches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Number of Sections *</label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.numberOfSections}
                  onChange={(e) => setFormData({ ...formData, numberOfSections: parseInt(e.target.value) || 1 })}
                  required
                  min={1}
                  max={26}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {formData.sections.map((section, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  padding: '0.5rem 1rem',
                  borderRadius: '1rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  Section {section}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetForm}
                className="glass-button"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                className="glass-button"
              >
                {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Batch' : 'Create Batch')}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}
      
      <GlassCard className="p-6">
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Batches</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        
        {!loading && batches.length === 0 && (
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
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No batches created yet</h3>
              <p style={{ margin: 0 }}>Click "Add Batch" to create your first batch</p>
            </div>
          </div>
        )}
        
        {!loading && batches.length > 0 && (
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
        )}
      </GlassCard>
      
    </div>
  );
};

export default BatchManagement;
