import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import GlassCard from './GlassCard';

const AdmitCardGeneration = () => {
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  
  const [selectedFilters, setSelectedFilters] = useState({
    university: '',
    campus: '',
    school: '',
    program: '',
    course: '',
    batch: '',
    semester: ''
  });
  const [admitCards, setAdmitCards] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          universitiesRes,
          campusesRes,
          schoolsRes,
          programsRes,
          coursesRes,
          batchesRes,
          semestersRes
        ] = await Promise.all([
          api.get('/universities?isActive=true'),
          api.get('/campus?isActive=true'),
          api.get('/schools'),
          api.get('/programs'),
          api.get('/courses'),
          api.get('/batches'),
          api.get('/semesters')
        ]);
        
        setUniversities(universitiesRes.data);
        setCampuses(campusesRes.data);
        setSchools(schoolsRes.data);
        setPrograms(programsRes.data);
        setCourses(coursesRes.data);
        setBatches(batchesRes.data);
        setSemesters(semestersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  const handleFilterChange = (field, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAdmitCards = async () => {
    try {
      const response = await api.post('/admit-cards/generate', selectedFilters);
      setAdmitCards(response.data);
    } catch (error) {
      console.error('Error generating admit cards:', error);
    }
  };

  const downloadAdmitCard = async (studentId) => {
    try {
      const response = await api.get(`/admit-cards/download/${studentId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admit-card-${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading admit card:', error);
    }
  };

  return (
    <div className="admit-card-generation">
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Generate Admit Cards</h2>
      
      <GlassCard>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <select
            className="glass-input"
            value={selectedFilters.university}
            onChange={(e) => handleFilterChange('university', e.target.value)}
          >
            <option value="">Select University</option>
            {universities.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          
          <select
            className="glass-input"
            value={selectedFilters.campus}
            onChange={(e) => handleFilterChange('campus', e.target.value)}
          >
            <option value="">Select Campus</option>
            {campuses.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          
          <select
            className="glass-input"
            value={selectedFilters.school}
            onChange={(e) => handleFilterChange('school', e.target.value)}
          >
            <option value="">Select School</option>
            {schools.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          
          <select
            className="glass-input"
            value={selectedFilters.program}
            onChange={(e) => handleFilterChange('program', e.target.value)}
          >
            <option value="">Select Program</option>
            {programs.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          
          <select
            className="glass-input"
            value={selectedFilters.course}
            onChange={(e) => handleFilterChange('course', e.target.value)}
          >
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          
          <select
            className="glass-input"
            value={selectedFilters.batch}
            onChange={(e) => handleFilterChange('batch', e.target.value)}
          >
            <option value="">Select Batch</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          
          <select
            className="glass-input"
            value={selectedFilters.semester}
            onChange={(e) => handleFilterChange('semester', e.target.value)}
          >
            <option value="">Select Semester</option>
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <button
          className="glass-button"
          onClick={generateAdmitCards}
          disabled={!Object.values(selectedFilters).some(Boolean)}
        >
          Generate Admit Cards
        </button>
      </GlassCard>
      
      {admitCards.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>Generated Admit Cards</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {admitCards.map(card => (
              <GlassCard key={card.student._id}>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>{card.student.name}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>
                    {card.student.email} • {card.student.universityId}
                  </p>
                  <button
                    className="glass-button glass-button-secondary"
                    onClick={() => downloadAdmitCard(card.student._id)}
                  >
                    Download PDF
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmitCardGeneration;