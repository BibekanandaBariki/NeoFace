import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import GlassCard from './GlassCard';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    duration: '',
    credits: 3
  });

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/courses/${formData._id}`, formData);
      } else {
        await api.post('/courses', formData);
      }
      
      setShowAddForm(false);
      setFormData({
        code: '',
        name: '',
        description: '',
        duration: '',
        credits: 3
      });
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleEdit = (course) => {
    setFormData(course);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  return (
    <div className="course-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white' }}>Course Management</h2>
        <button 
          className="glass-button"
          onClick={() => {
            setFormData({
              code: '',
              name: '',
              description: '',
              duration: '',
              credits: 3
            });
            setShowAddForm(!showAddForm);
          }}
        >
          {showAddForm ? 'Cancel' : 'Add Course'}
        </button>
      </div>

      {showAddForm ? (
        <GlassCard>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Course Code
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
                  Course Name
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
                  Duration
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  placeholder="e.g., 4 years"
                />
              </div>
              
              <div>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Credits
                </label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.credits}
                  onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                Description
              </label>
              <textarea
                className="glass-input"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
              />
            </div>
            
            <button type="submit" className="glass-button">
              Save Course
            </button>
          </form>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {courses.map(course => (
            <GlassCard key={course._id}>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{course.code} - {course.name}</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>
                {course.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Duration: {course.duration} • Credits: {course.credits}
                </span>
                <div>
                  <button 
                    className="glass-button glass-button-secondary"
                    onClick={() => handleEdit(course)}
                    style={{ marginRight: '0.5rem' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="glass-button glass-button-danger"
                    onClick={() => handleDelete(course._id)}
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

export default CourseManagement;