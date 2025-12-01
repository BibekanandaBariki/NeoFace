import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import GlassCard from './GlassCard';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    fullName: '',
    university: '',
    campus: '',
    school: '',
    program: '',
    description: '',
    credits: '',
    hod: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchUniversities();
    fetchCampuses();
    fetchSchools();
    fetchPrograms();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses');
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
      setError('Failed to fetch universities');
    }
  };

  const fetchCampuses = async () => {
    try {
      const response = await api.get('/api/campus?isActive=true');
      setCampuses(response.data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      setError('Failed to fetch campuses');
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.get('/api/schools?isActive=true');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setError('Failed to fetch schools');
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/api/programs?isActive=true');
      setPrograms(response.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to fetch programs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      console.log('📝 Submitting course data:', formData);
      
      if (editingCourse) {
        await api.put(`/api/courses/${editingCourse._id}`, formData);
        setSuccess('Course updated successfully!');
      } else {
        await api.post('/api/courses', formData);
        setSuccess('Course created successfully!');
      }
      
      setShowForm(false);
      setEditingCourse(null);
      setFormData({
        code: '',
        name: '',
        fullName: '',
        university: '',
        campus: '',
        school: '',
        program: '',
        description: '',
        credits: '',
        hod: ''
      });
      fetchCourses();
    } catch (error) {
      console.error('❌ Course submission error:', error.response?.data || error.message);
      setError(error.response?.data?.message || `Failed to ${editingCourse ? 'update' : 'create'} course`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      setLoading(true);
      await api.delete(`/api/courses/${id}`);
      setSuccess('Course deleted successfully!');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code || '',
      name: course.name || '',
      fullName: course.fullName || '',
      university: course.university?._id || course.university || '',
      campus: course.campus?._id || course.campus || '',
      school: course.school?._id || course.school || '',
      program: course.program?._id || course.program || '',
      description: course.description || '',
      credits: course.credits || '',
      hod: course.hod?._id || course.hod || ''
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

  // Filter campuses based on selected university
  const filteredCampuses = campuses.filter(campus => 
    !formData.university || campus.university?._id === formData.university
  );

  // Filter schools based on selected university and campus
  const filteredSchools = schools.filter(school => 
    (!formData.university || school.university?._id === formData.university) &&
    (!formData.campus || school.campus?._id === formData.campus)
  );

  // Filter programs based on selected university, campus, and school
  const filteredPrograms = programs.filter(program => 
    (!formData.university || program.university?._id === formData.university) &&
    (!formData.campus || program.campus?._id === formData.campus) &&
    (!formData.school || program.school?._id === formData.school)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Course Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingCourse(null);
            setFormData({
              code: '',
              name: '',
              fullName: '',
              university: '',
              campus: '',
              school: '',
              program: '',
              description: '',
              credits: '',
              hod: ''
            });
            setShowForm(!showForm);
          }}
          className="glass-button"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {showForm ? 'Cancel' : '+ Add Course'}
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
            {editingCourse ? 'Edit Course' : 'Add New Course'}
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
                placeholder="COURSE"
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
                placeholder="Course Name"
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
                placeholder="Full Course Name"
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
                {filteredCampuses.map(campus => (
                  <option key={campus._id} value={campus._id}>
                    {campus.name} ({campus.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>School *</label>
              <select
                name="school"
                value={formData.school}
                onChange={handleChange}
                required
                className="glass-input"
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Select School</option>
                {filteredSchools.map(school => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Program *</label>
              <select
                name="program"
                value={formData.program}
                onChange={handleChange}
                required
                className="glass-input"
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Select Program</option>
                {filteredPrograms.map(program => (
                  <option key={program._id} value={program._id}>
                    {program.name} ({program.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Credits</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                className="glass-input"
                placeholder="4"
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
                placeholder="Course description"
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
                {loading ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <GlassCard className="p-6">
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>Courses</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        
        {!loading && courses.length === 0 && (
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
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No courses created yet</h3>
              <p style={{ margin: 0 }}>Click "Add Course" to create your first course</p>
            </div>
          </div>
        )}
        
        {!loading && courses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {courses.map((course) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'white', margin: 0, marginBottom: '0.25rem' }}>{course.name}</h3>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      Code: {course.code}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: course.isActive ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    color: course.isActive ? '#4cd137' : '#ff6b6b'
                  }}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {course.program && <div>🎓 {course.program.name} ({course.program.code})</div>}
                  <div>📊 {course.credits} Credits</div>
                  {course.university && <div>🏫 {course.university.name} ({course.university.code})</div>}
                  {course.description && <div>📝 {course.description}</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(course)}
                    className="glass-button"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
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

export default CourseManagement;