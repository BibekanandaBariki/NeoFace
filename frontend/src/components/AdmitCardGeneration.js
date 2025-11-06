import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

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
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);
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
    fetchUniversities();
    fetchCampuses();
    fetchSchools();
    fetchPrograms();
    fetchCourses();
    fetchBatches();
    // Generate semesters 1-8
    setSemesters(Array.from({ length: 8 }, (_, i) => i + 1));
  }, []);

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/universities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUniversities(data);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const fetchCampuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/campus', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampuses(data);
      }
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schools', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/programs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/batches', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
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
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        university: filters.university,
        campus: filters.campus,
        school: filters.school,
        program: filters.program,
        course: filters.course,
        batch: filters.batch,
        semester: filters.semester
      });

      const response = await fetch(`/api/examination/check-eligibility?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEligibleStudents(data.eligibleStudents || []);
        setIneligibleStudents(data.ineligibleStudents || []);
      } else {
        const error = await response.json();
        alert(`Error checking eligibility: ${error.message}`);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      alert('Failed to check eligibility');
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
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/examination/generate-admit-cards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentIds: eligibleStudents.map(student => student._id),
          filters: filters
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = 'admit-cards.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('Admit cards generated and downloaded successfully!');
      } else {
        const error = await response.json();
        alert(`Error generating admit cards: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating admit cards:', error);
      alert('Failed to generate admit cards');
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
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Admit Card Generation</h2>
      
      <GlassCard className="mb-6 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Eligibility Check</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">University *</label>
            <select
              name="university"
              value={filters.university}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Campus *</label>
            <select
              name="campus"
              value={filters.campus}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.university}
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
            <label className="block text-sm font-medium text-gray-300 mb-1">School *</label>
            <select
              name="school"
              value={filters.school}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.campus}
            >
              <option value="">Select School</option>
              {filteredSchools.map(school => (
                <option key={school._id} value={school._id}>
                  {school.name} ({school.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Program *</label>
            <select
              name="program"
              value={filters.program}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.school}
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Course *</label>
            <select
              name="course"
              value={filters.course}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.program}
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Batch *</label>
            <select
              name="batch"
              value={filters.batch}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.course}
            >
              <option value="">Select Batch</option>
              {filteredBatches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.year}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Semester *</label>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Semester</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={checkEligibility}
              disabled={checkingEligibility || !filters.university || !filters.campus || !filters.school || 
                       !filters.program || !filters.course || !filters.batch || !filters.semester}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {checkingEligibility ? 'Checking...' : 'Check Eligibility'}
            </motion.button>
          </div>
        </div>
      </GlassCard>

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
                <div className="text-center py-8 text-gray-400">
                  No eligible students found
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
                <div className="text-center py-8 text-gray-400">
                  No ineligible students found
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