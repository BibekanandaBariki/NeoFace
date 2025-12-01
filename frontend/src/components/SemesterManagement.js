import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import GlassCard from './GlassCard';
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
    holidays: [],
    universityId: '',
    campusId: '',
    schoolId: '',
    programId: '',
    courseId: '',
    branchId: '',
    batchId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Hierarchical data states
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchSemesters();
    fetchUniversities();
  }, []);

  // Hierarchical data fetching functions
  const fetchUniversities = async () => {
    try {
      const response = await api.get('/api/universities?isActive=true');
      setUniversities(response.data);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
    }
  };

  const fetchCampuses = async (universityId) => {
    try {
      const response = await api.get(`/api/campus?university=${universityId}&isActive=true`);
      setCampuses(response.data);
    } catch (err) {
      console.error('Failed to fetch campuses:', err);
    }
  };

  const fetchSchools = async (campusId) => {
    try {
      const response = await api.get(`/api/schools?campus=${campusId}&isActive=true`);
      setSchools(response.data);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  };

  const fetchPrograms = async (schoolId) => {
    try {
      const response = await api.get(`/api/programs?school=${schoolId}&isActive=true`);
      setPrograms(response.data);
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    }
  };

  const fetchCourses = async (programId) => {
    try {
      const response = await api.get(`/api/courses?program=${programId}&isActive=true`);
      setCourses(response.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchBranches = async (courseId) => {
    try {
      const response = await api.get(`/api/branches?course=${courseId}&isActive=true`);
      setBranches(response.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchBatches = async (branchId) => {
    try {
      console.log('Fetching batches for branch:', branchId);
      const response = await api.get(`/api/batches?branch=${branchId}&isActive=true`);
      console.log('Batches response:', response.data);
      setBatches(response.data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  };

  // Hierarchical selection handlers
  const handleUniversityChange = (universityId) => {
    setFormData(prev => ({
      ...prev,
      universityId,
      campusId: '',
      schoolId: '',
      programId: '',
      courseId: '',
      branchId: '',
      batchId: ''
    }));
    if (universityId) {
      fetchCampuses(universityId);
    } else {
      setCampuses([]);
    }
    setSchools([]);
    setPrograms([]);
    setCourses([]);
    setBranches([]);
    setBatches([]);
  };

  const handleCampusChange = (campusId) => {
    setFormData(prev => ({
      ...prev,
      campusId,
      schoolId: '',
      programId: '',
      courseId: '',
      branchId: '',
      batchId: ''
    }));
    if (campusId) {
      fetchSchools(campusId);
    } else {
      setSchools([]);
    }
    setPrograms([]);
    setCourses([]);
    setBranches([]);
    setBatches([]);
  };

  const handleSchoolChange = (schoolId) => {
    setFormData(prev => ({
      ...prev,
      schoolId,
      programId: '',
      courseId: '',
      branchId: '',
      batchId: ''
    }));
    if (schoolId) {
      fetchPrograms(schoolId);
    } else {
      setPrograms([]);
    }
    setCourses([]);
    setBranches([]);
    setBatches([]);
  };

  const handleProgramChange = (programId) => {
    setFormData(prev => ({
      ...prev,
      programId,
      courseId: '',
      branchId: '',
      batchId: ''
    }));
    if (programId) {
      fetchCourses(programId);
    } else {
      setCourses([]);
    }
    setBranches([]);
    setBatches([]);
  };

  const handleCourseChange = (courseId) => {
    setFormData(prev => ({
      ...prev,
      courseId,
      branchId: '',
      batchId: ''
    }));
    if (courseId) {
      fetchBranches(courseId);
    } else {
      setBranches([]);
    }
    setBatches([]);
  };

  const handleBranchChange = (branchId) => {
    setFormData(prev => ({
      ...prev,
      branchId,
      batchId: ''
    }));
    if (branchId) {
      fetchBatches(branchId);
    } else {
      setBatches([]);
    }
  };

  const handleBatchChange = (batchId) => {
    setFormData(prev => ({
      ...prev,
      batchId
    }));
  };

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
      const semesterData = {
        ...formData,
        campus: formData.campusId,
        program: formData.programId,
        branch: formData.branchId,
        batch: formData.batchId
      };
      
      if (editingId) {
        await api.put(`/api/semesters/${editingId}`, semesterData);
        setSuccess('Semester updated successfully!');
      } else {
        await api.post('/api/semesters', semesterData);
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
        holidays: [],
        universityId: '',
        campusId: '',
        schoolId: '',
        programId: '',
        courseId: '',
        branchId: '',
        batchId: ''
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
      holidays: semester.holidays || [],
      universityId: semester.university?._id || '',
      campusId: semester.campus?._id || '',
      schoolId: semester.school?._id || '',
      programId: semester.program?._id || '',
      courseId: semester.course?._id || '',
      branchId: semester.branch?._id || '',
      batchId: semester.batch?._id || ''
    });
    
    // Load hierarchical data if available
    if (semester.university?._id) {
      fetchCampuses(semester.university._id);
    }
    if (semester.campus?._id) {
      fetchSchools(semester.campus._id);
    }
    if (semester.school?._id) {
      fetchPrograms(semester.school._id);
    }
    if (semester.program?._id) {
      fetchCourses(semester.program._id);
    }
    if (semester.course?._id) {
      fetchBranches(semester.course._id);
    }
    if (semester.branch?._id) {
      fetchBatches(semester.branch._id);
    }
    
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
      holidays: [],
      universityId: '',
      campusId: '',
      schoolId: '',
      programId: '',
      courseId: '',
      branchId: '',
      batchId: ''
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Semester Management</h2>
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
          style={{ marginBottom: '2rem' }}
        >
          <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>{editingId ? 'Edit Semester' : 'Create New Semester'}</h3>
          <form onSubmit={handleSubmit}>
            {/* Hierarchical Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  University
                </label>
                <select
                  className="glass-input"
                  value={formData.universityId}
                  onChange={(e) => handleUniversityChange(e.target.value)}
                  required
                >
                  <option value="">Select University</option>
                  {universities.map(uni => (
                    <option key={uni._id} value={uni._id}>{uni.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Campus
                </label>
                <select
                  className="glass-input"
                  value={formData.campusId}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  disabled={!formData.universityId}
                  required
                >
                  <option value="">Select Campus</option>
                  {campuses.map(campus => (
                    <option key={campus._id} value={campus._id}>{campus.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  School
                </label>
                <select
                  className="glass-input"
                  value={formData.schoolId}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  disabled={!formData.campusId}
                  required
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school._id} value={school._id}>{school.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Program
                </label>
                <select
                  className="glass-input"
                  value={formData.programId}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  disabled={!formData.schoolId}
                  required
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program._id} value={program._id}>{program.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Course
                </label>
                <select
                  className="glass-input"
                  value={formData.courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  disabled={!formData.programId}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Branch
                </label>
                <select
                  className="glass-input"
                  value={formData.branchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  disabled={!formData.courseId}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Batch
                </label>
                <select
                  className="glass-input"
                  value={formData.batchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  disabled={!formData.branchId}
                  required
                >
                  <option value="">Select Batch</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch._id}>{batch.year} ({batch.admissionYear}-{batch.passOutYear})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Basic Semester Info */}
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
      <GlassCard>
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Semesters</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {loading && semesters.length === 0 ? (
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
                padding: '2rem'
              }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            </div>
          ) : semesters.length === 0 ? (
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
                <h3 style={{ margin: '0 0 0.5rem 0' }}>No semesters created yet</h3>
                <p style={{ margin: 0 }}>Click "Add Semester" to create your first semester</p>
              </div>
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
      </GlassCard>
    </div>
  );
};

export default SemesterManagement;
