import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import api from '../utils/api';

const AdmitCardGeneration = () => {
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [ineligibleStudents, setIneligibleStudents] = useState([]);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    university: '',
    campus: '',
    school: '',
    program: '',
    course: '',
    batch: '',
    semester: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [
          universitiesRes,
          campusesRes,
          schoolsRes,
          programsRes,
          coursesRes,
          batchesRes
        ] = await Promise.all([
          api.get('/universities?isActive=true'),
          api.get('/campus?isActive=true'),
          api.get('/schools?isActive=true'),
          api.get('/programs?isActive=true'),
          api.get('/courses?isActive=true'),
          api.get('/batches?isActive=true')
        ]);

        setUniversities(universitiesRes.data);
        setCampuses(campusesRes.data);
        setSchools(schoolsRes.data);
        setPrograms(programsRes.data);
        setCourses(coursesRes.data);
        setBatches(batchesRes.data);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchUniversities = async () => {
    try {
      const { data } = await api.get('/universities?isActive=true');
      setUniversities(data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const fetchCampuses = async () => {
    try {
      const { data } = await api.get('/campus?isActive=true');
      setCampuses(data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const { data } = await api.get('/schools?isActive=true');
      setSchools(data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const { data } = await api.get('/programs?isActive=true');
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses?isActive=true');
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/batches?isActive=true');
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkEligibility = async () => {
    // Validate required filters
    if (!filters.university || !filters.campus || !filters.school || 
        !filters.program || !filters.course || !filters.batch || !filters.semester) {
      alert('Please select all filters');
      return;
    }

    try {
      setCheckingEligibility(true);
      const params = {
        university: filters.university,
        campus: filters.campus,
        school: filters.school,
        program: filters.program,
        course: filters.course,
        batch: filters.batch,
        semester: filters.semester
      };
      const { data } = await api.get('/examination/check-eligibility', { params });
      setEligibleStudents(data.eligibleStudents || []);
      setIneligibleStudents(data.ineligibleStudents || []);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      alert(`Failed to check eligibility: ${error.response?.data?.message || error.message}`);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const generateAdmitCards = async () => {
    if (eligibleStudents.length === 0) {
      alert('No eligible students to generate admit cards for');
      return;
    }

    try {
      setGeneratingCards(true);
      const { data } = await api.post('/examination/generate-admit-cards', {
        studentIds: eligibleStudents.map(student => student._id),
        filters
      });
      // Trigger download (placeholder URL)
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = 'admit-cards.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('Admit cards generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating admit cards:', error);
      alert(`Error generating admit cards: ${error.response?.data?.message || error.message}`);
    } finally {
      setGeneratingCards(false);
    }
  };

  // Filter data based on selections
  const filteredCampuses = campuses.filter(campus => 
    !filters.university || campus.university?._id === filters.university
  );

  const filteredSchools = schools.filter(school => 
    (!filters.university || school.university?._id === filters.university) &&
    (!filters.campus || school.campus?._id === filters.campus)
  );

  const filteredPrograms = programs.filter(program => 
    (!filters.university || program.university?._id === filters.university) &&
    (!filters.campus || program.campus?._id === filters.campus) &&
    (!filters.school || program.school?._id === filters.school)
  );

  const filteredCourses = courses.filter(course => 
    (!filters.university || course.university?._id === filters.university) &&
    (!filters.campus || course.campus?._id === filters.campus) &&
    (!filters.school || course.school?._id === filters.school) &&
    (!filters.program || course.program?._id === filters.program)
  );

  const filteredBatches = batches.filter(batch => 
    (!filters.university || batch.university?._id === filters.university) &&
    (!filters.campus || batch.campus?._id === filters.campus) &&
    (!filters.school || batch.school?._id === filters.school) &&
    (!filters.program || batch.program?._id === filters.program) &&
    (!filters.course || batch.course?._id === filters.course)
  );

  return (
    <div>
      <h2 style={{ color: 'white', margin: 0, marginBottom: '1.5rem' }}>Admit Card Generation</h2>
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: '1.5rem', marginBottom: '2rem' }}
      >
        <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Eligibility Check</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>University *</label>
            <select
              name="university"
              value={filters.university}
              onChange={handleFilterChange}
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
              value={filters.campus}
              onChange={handleFilterChange}
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
              value={filters.school}
              onChange={handleFilterChange}
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
              value={filters.program}
              onChange={handleFilterChange}
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
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Course *</label>
            <select
              name="course"
              value={filters.course}
              onChange={handleFilterChange}
              className="glass-input"
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Select Course</option>
              {filteredCourses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Batch *</label>
            <select
              name="batch"
              value={filters.batch}
              onChange={handleFilterChange}
              className="glass-input"
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Select Batch</option>
              {filteredBatches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.year} ({batch.admissionYear}-{batch.passOutYear})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Semester *</label>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="glass-input"
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Select Semester</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={checkEligibility}
              disabled={checkingEligibility}
              className="glass-button"
              style={{ 
                padding: '0.5rem 1rem', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                width: '100%',
                height: 'fit-content'
              }}
            >
              {checkingEligibility ? 'Checking...' : 'Check Eligibility'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {(eligibleStudents.length > 0 || ineligibleStudents.length > 0) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Eligible Students */}
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Eligible Students ({eligibleStudents.length})
                </h3>
                {eligibleStudents.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateAdmitCards}
                    disabled={generatingCards}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generatingCards ? 'Generating...' : 'Generate Admit Cards'}
                  </motion.button>
                )}
              </div>
              
              {eligibleStudents.length === 0 ? (
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
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>No eligible students found</h3>
                    <p style={{ margin: 0 }}>No students meet the eligibility criteria</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-300">Name</th>
                        <th className="text-left py-2 px-3 text-gray-300">Student ID</th>
                        <th className="text-left py-2 px-3 text-gray-300">Overall %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleStudents.map((student, index) => (
                        <tr key={student._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-2 px-3 text-white">{student.name}</td>
                          <td className="py-2 px-3 text-gray-300">{student.universityId}</td>
                          <td className="py-2 px-3 text-green-400">
                            {student.overallAttendancePercentage?.toFixed(1) || 'N/A'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>

            {/* Ineligible Students */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Ineligible Students ({ineligibleStudents.length})
              </h3>
              
              {ineligibleStudents.length === 0 ? (
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
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>No ineligible students found</h3>
                    <p style={{ margin: 0 }}>All students meet the eligibility criteria</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-300">Name</th>
                        <th className="text-left py-2 px-3 text-gray-300">Student ID</th>
                        <th className="text-left py-2 px-3 text-gray-300">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ineligibleStudents.map((student, index) => (
                        <tr key={student._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-2 px-3 text-white">{student.name}</td>
                          <td className="py-2 px-3 text-gray-300">{student.universityId}</td>
                          <td className="py-2 px-3 text-red-400">
                            {student.ineligibilityReason || 'Attendance below 75%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
};

export default AdmitCardGeneration;