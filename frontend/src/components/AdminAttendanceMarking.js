import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import FaceRecognitionCapture from './FaceRecognitionCapture';
import GlassCard from './GlassCard';
import '../styles/glassmorphism.css';

const AdminAttendanceMarking = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Face recognition state
  const [useFaceRecognition, setUseFaceRecognition] = useState(false);
  
  // Hierarchical data states
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  // Add loading states for hierarchical data
  const [hierarchicalLoading, setHierarchicalLoading] = useState({
    universities: false,
    campuses: false,
    schools: false,
    programs: false,
    courses: false,
    branches: false,
    batches: false
  });

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/subjects?isActive=true';
      
      // Add hierarchical filters if selected
      if (selectedUniversity) url += `&universityId=${selectedUniversity}`;
      if (selectedCampus) url += `&campusId=${selectedCampus}`;
      if (selectedSchool) url += `&schoolId=${selectedSchool}`;
      if (selectedProgram) url += `&programId=${selectedProgram}`;
      if (selectedCourse) url += `&courseId=${selectedCourse}`;
      if (selectedBranch) url += `&branchId=${selectedBranch}`;
      if (selectedBatch) url += `&batchId=${selectedBatch}`;
      
      console.log('Fetching subjects with URL:', url);
      
      const response = await api.get(url);
      console.log('Subjects response:', response.data);
      
      // Log the structure of the first subject to understand the data
      if (response.data.length > 0) {
        console.log('First subject structure:', response.data[0]);
      }
      
      setSubjects(response.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError(`Failed to load subjects: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedUniversity, selectedCampus, selectedSchool, selectedProgram, selectedCourse, selectedBranch, selectedBatch]);

  const fetchStudentsForSubject = useCallback(async () => {
    try {
      const subject = subjects.find(s => s._id === selectedSubject);
      if (!subject) return;

      console.log('Selected subject details:', subject);
      console.log('Subject branch info:', {
        branch: subject.branch,
        department: subject.department,
        branchType: typeof subject.branch,
        branchKeys: subject.branch ? Object.keys(subject.branch) : null
      });

      setLoading(true);
      const response = await api.get(`/api/students?department=${subject.department}&semester=${subject.semester}`);
      setStudents(response.data);
      
      // Initialize attendance data
      const initialData = response.data.map(student => ({
        studentId: student._id,
        student: student,
        status: 'absent',
        marked: false
      }));
      setAttendanceData(initialData);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to load students:', err);
      setError(`Failed to load students: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, subjects]);

  const fetchTimetableForDate = useCallback(async () => {
    try {
      const subject = subjects.find(s => s._id === selectedSubject);
      if (!subject) {
        console.log('No subject found for selectedSubject:', selectedSubject);
        setAvailableSlots([]);
        return;
      }

      console.log('Selected subject details:', subject);
      
      // Get the branch identifier - try to use the branch ID if available, otherwise fallback to code
      let branchIdentifier = subject.department; // Default fallback
      if (subject.branch) {
        // If branch is populated as an object, use its _id
        if (typeof subject.branch === 'object' && subject.branch._id) {
          branchIdentifier = subject.branch._id;
        } 
        // If branch is populated as an object with code, use the code
        else if (typeof subject.branch === 'object' && subject.branch.code) {
          branchIdentifier = subject.branch.code;
        } 
        // If branch is just a string, use it directly
        else if (typeof subject.branch === 'string') {
          branchIdentifier = subject.branch;
        }
      }
      
      const section = subject.section || 'A';
      
      console.log('Fetching timetable for:', { 
        subjectId: selectedSubject, 
        subjectCode: subject.code,
        subjectName: subject.name,
        date: selectedDate,
        branch: branchIdentifier,
        section: section
      });
      
      setLoading(true);
      const response = await api.get(`/api/timetables/for-date/${selectedDate}`, {
        params: {
          branch: branchIdentifier,
          section: section
        }
      });

      console.log('Timetable response:', response.data);

      if (response.data && response.data.schedule) {
        console.log('Full schedule slots:', response.data.schedule.slots);
        
        // Filter slots for the selected subject
        const slots = response.data.schedule.slots.filter(slot => {
          console.log('Checking slot for subject match:', {
            slotSubject: slot.subject,
            slotSubjectCode: slot.subjectCode,
            slotSubjectName: slot.subjectName,
            selectedSubjectId: selectedSubject,
            subjectCode: subject.code,
            subjectName: subject.name
          });
          
          // Multiple ways to match the subject
          const match = 
            // Direct ID match
            slot.subject?._id?.toString() === selectedSubject || 
            slot.subject?.toString() === selectedSubject ||
            // Code match
            slot.subject === subject.code || 
            slot.subjectCode === subject.code ||
            // Name match
            slot.subjectName === subject.name;
            
          console.log('Slot match result:', match);
          return match;
        });
        
        console.log('Filtered slots for subject:', slots);
        setAvailableSlots(slots);
        
        // If no slots found for this subject, show a specific message
        if (slots.length === 0) {
          setError(`No timetable slots found for subject ${subject.code} on this date. Please check if a timetable has been created for this branch/section.`);
        }
      } else {
        console.log('No schedule found in timetable response');
        setAvailableSlots([]);
        setError(`No timetable found for branch ${branchIdentifier}, section ${section} on this date. Please create a timetable first.`);
      }
      setError(''); // Clear any previous errors if successful
    } catch (err) {
      console.error('Timetable fetch error:', err);
      // Don't show error for timetable not found - it's expected when no timetable exists
      if (err.response?.status === 404) {
        setAvailableSlots([]);
        setError(`No timetable found for this branch/section on this date. Please create a timetable first.`);
      } else if (err.response?.status !== 404) {
        setError(`Failed to load timetable: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
      }
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedDate, subjects]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchStudentsForSubject();
      // Also fetch timetable when subject changes if date is already selected
      if (selectedDate) {
        console.log('Fetching timetable because subject and date are selected');
        fetchTimetableForDate();
      }
    }
  }, [selectedSubject, fetchStudentsForSubject, fetchTimetableForDate, selectedDate]);

  useEffect(() => {
    if (selectedSubject && selectedDate) {
      console.log('Fetching timetable because both subject and date changed');
      fetchTimetableForDate();
    }
  }, [selectedSubject, selectedDate, fetchTimetableForDate]);

  // Fetch hierarchical data
  const fetchUniversities = useCallback(async () => {
    try {
      setHierarchicalLoading(prev => ({ ...prev, universities: true }));
      const response = await api.get('/api/universities?isActive=true');
      setUniversities(response.data);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
      setError(`Failed to fetch universities: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setHierarchicalLoading(prev => ({ ...prev, universities: false }));
    }
  }, []);

  const fetchCampuses = useCallback(async (universityId) => {
    try {
      setHierarchicalLoading(prev => ({ ...prev, campuses: true }));
      const response = await api.get(`/api/campus?university=${universityId}&isActive=true`);
      setCampuses(response.data);
    } catch (err) {
      console.error('Failed to fetch campuses:', err);
      setError(`Failed to fetch campuses: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setHierarchicalLoading(prev => ({ ...prev, campuses: false }));
    }
  }, []);

  const fetchSchools = useCallback(async (campusId) => {
    try {
      setHierarchicalLoading(prev => ({ ...prev, schools: true }));
      const response = await api.get(`/api/schools?campus=${campusId}&isActive=true`);
      setSchools(response.data);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
      setError(`Failed to fetch schools: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setHierarchicalLoading(prev => ({ ...prev, schools: false }));
    }
  }, []);

  const fetchPrograms = useCallback(async (schoolId) => {
    try {
      setHierarchicalLoading(prev => ({ ...prev, programs: true }));
      const response = await api.get(`/api/programs?school=${schoolId}&isActive=true`);
      setPrograms(response.data);
    } catch (err) {
      console.error('Failed to fetch programs:', err);
      setError(`Failed to fetch programs: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setHierarchicalLoading(prev => ({ ...prev, programs: false }));
    }
  }, []);

  const fetchCourses = useCallback(async (programId) => {
    try {
      setHierarchicalLoading(prev => ({ ...prev, courses: true }));
      const response = await api.get(`/api/courses?program=${programId}&isActive=true`);
      setCourses(response.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError(`Failed to fetch courses: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setHierarchicalLoading(prev => ({ ...prev, courses: false }));
    }
  }, []);

  const fetchBranches = useCallback(async (courseId) => {
    try {
      setHierarchicalLoading(prev => ({ ...prev, branches: true }));
      const response = await api.get(`/api/branches?course=${courseId}&isActive=true`);
      setBranches(response.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError(`Failed to fetch branches: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setHierarchicalLoading(prev => ({ ...prev, branches: false }));
    }
  }, []);

  const fetchBatches = useCallback(async (branchId) => {
    try {
      setHierarchicalLoading(prev => ({ ...prev, batches: true }));
      const response = await api.get(`/api/batches?branch=${branchId}&isActive=true`);
      setBatches(response.data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setError(`Failed to fetch batches: ${err.response?.data?.message || err.message || 'Network error or server unavailable'}`);
    } finally {
      setHierarchicalLoading(prev => ({ ...prev, batches: false }));
    }
  }, []);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  // Handle hierarchical selection changes
  useEffect(() => {
    if (selectedUniversity) {
      fetchCampuses(selectedUniversity);
      // Reset downstream selections
      setSelectedCampus('');
      setSelectedSchool('');
      setSelectedProgram('');
      setSelectedCourse('');
      setSelectedBranch('');
      setSelectedBatch('');
    }
  }, [selectedUniversity, fetchCampuses]);

  useEffect(() => {
    if (selectedCampus) {
      fetchSchools(selectedCampus);
      // Reset downstream selections
      setSelectedSchool('');
      setSelectedProgram('');
      setSelectedCourse('');
      setSelectedBranch('');
      setSelectedBatch('');
    }
  }, [selectedCampus, fetchSchools]);

  useEffect(() => {
    if (selectedSchool) {
      fetchPrograms(selectedSchool);
      // Reset downstream selections
      setSelectedProgram('');
      setSelectedCourse('');
      setSelectedBranch('');
      setSelectedBatch('');
    }
  }, [selectedSchool, fetchPrograms]);

  useEffect(() => {
    if (selectedProgram) {
      fetchCourses(selectedProgram);
      // Reset downstream selections
      setSelectedCourse('');
      setSelectedBranch('');
      setSelectedBatch('');
    }
  }, [selectedProgram, fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchBranches(selectedCourse);
      // Reset downstream selections
      setSelectedBranch('');
      setSelectedBatch('');
    }
  }, [selectedCourse, fetchBranches]);

  useEffect(() => {
    if (selectedBranch) {
      fetchBatches(selectedBranch);
      // Reset downstream selection
      setSelectedBatch('');
    }
  }, [selectedBranch, fetchBatches]);

  const handleToggleAttendance = (studentId) => {
    setAttendanceData(attendanceData.map(item =>
      item.studentId === studentId
        ? { ...item, status: item.status === 'present' ? 'absent' : 'present' }
        : item
    ));
  };

  const handleMarkAll = (status) => {
    setAttendanceData(attendanceData.map(item => ({ ...item, status })));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setLoading(true);

      const attendanceRecords = attendanceData.map(item => ({
        studentId: item.studentId,
        status: item.status
      }));

      console.log('Submitting attendance with data:', {
        students: attendanceRecords,
        subjectId: selectedSubject,
        date: selectedDate,
        slotNumber: selectedSlot.slotNumber,
        classStartTime: selectedSlot.startTime,
        classEndTime: selectedSlot.endTime,
        defaultStatus: 'absent'
      });

      await api.post('/api/attendance/bulk-mark', {
        students: attendanceRecords,
        subjectId: selectedSubject,
        date: selectedDate,
        slotNumber: selectedSlot.slotNumber,
        classStartTime: selectedSlot.startTime,
        classEndTime: selectedSlot.endTime,
        defaultStatus: 'absent'
      });

      setSuccess(`Attendance marked successfully for ${attendanceRecords.length} students!`);
      
      // Mark all as marked
      setAttendanceData(attendanceData.map(item => ({ ...item, marked: true })));
    } catch (err) {
      console.error('Attendance submission error:', err);
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceRecognitionAttendance = (attendanceRecord) => {
    console.log('Face recognition attendance record:', attendanceRecord);
    
    // Update the attendance data to mark this student as present
    if (attendanceRecord && attendanceRecord.studentId) {
      setAttendanceData(prevData => 
        prevData.map(item => 
          item.studentId === attendanceRecord.studentId 
            ? { ...item, status: 'present', marked: true }
            : item
        )
      );
      
      setSuccess(`Attendance marked via face recognition for ${attendanceRecord.studentName || 'student'}!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    }
  };

  const presentCount = attendanceData.filter(a => a.status === 'present').length;
  const absentCount = attendanceData.filter(a => a.status === 'absent').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Mark Attendance</h2>
      </div>

      <GlassCard>
        {/* Error and Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="notification-error"
            style={{ marginBottom: '1.5rem' }}
          >
            <span>⚠️</span> {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="notification-success"
            style={{ marginBottom: '1.5rem' }}
          >
            <span>✓</span> {success}
          </motion.div>
        )}

        {/* Loading indicator for main content */}
        {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '3rem',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <div className="loading-spinner" style={{ marginRight: '1rem' }}></div>
            Loading...
          </div>
        )}

        {/* Filters */}
        {!loading && (
          <div style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '1.25rem',
              rowGap: '1.5rem'
            }}>
              {/* Hierarchical Selection */}
              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  University
                </label>
                <select
                  className="glass-input"
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select University</option>
                  {universities.map(university => (
                    <option key={university._id} value={university._id}>
                      {university.name}
                    </option>
                  ))}
                </select>
                {hierarchicalLoading.universities && (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.8rem', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Loading...
                  </div>
                )}
              </div>

              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Campus
                </label>
                <select
                  className="glass-input"
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  disabled={!selectedUniversity || hierarchicalLoading.campuses}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select Campus</option>
                  {campuses.map(campus => (
                    <option key={campus._id} value={campus._id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
                {hierarchicalLoading.campuses && (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.8rem', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Loading...
                  </div>
                )}
              </div>

              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  School
                </label>
                <select
                  className="glass-input"
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  disabled={!selectedCampus || hierarchicalLoading.schools}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school._id} value={school._id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                {hierarchicalLoading.schools && (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.8rem', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Loading...
                  </div>
                )}
              </div>

              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Program
                </label>
                <select
                  className="glass-input"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  disabled={!selectedSchool || hierarchicalLoading.programs}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program._id} value={program._id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {hierarchicalLoading.programs && (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.8rem', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Loading...
                  </div>
                )}
              </div>

              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Course
                </label>
                <select
                  className="glass-input"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={!selectedProgram || hierarchicalLoading.courses}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {hierarchicalLoading.courses && (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.8rem', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Loading...
                  </div>
                )}
              </div>

              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Branch
                </label>
                <select
                  className="glass-input"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={!selectedCourse || hierarchicalLoading.branches}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {hierarchicalLoading.branches && (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.8rem', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Loading...
                  </div>
                )}
              </div>

              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Batch
                </label>
                <select
                  className="glass-input"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  disabled={!selectedBranch || hierarchicalLoading.batches}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select Batch</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.year} ({batch.admissionYear}-{batch.passOutYear})
                    </option>
                  ))}
                </select>
                {hierarchicalLoading.batches && (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.8rem', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Loading...
                  </div>
                )}
              </div>

              {/* Subject and Date */}
              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Subject
                </label>
                <select
                  className="glass-input"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!selectedUniversity || !selectedCampus || !selectedSchool || !selectedProgram || !selectedCourse || !selectedBranch || !selectedBatch}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name} (Semester {subject.semester})
                    </option>
                  ))}
                </select>
                {/* Debug info */}
                <div style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  fontSize: '0.8rem', 
                  marginTop: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  Total subjects: {subjects.length}
                </div>
              </div>

              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Date
                </label>
                <input
                  type="date"
                  className="glass-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Time Slot
                </label>
                <select
                  className="glass-input"
                  value={selectedSlot ? `${selectedSlot.slotNumber}-${selectedSlot.startTime}-${selectedSlot.endTime}` : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [slotNumber, startTime, endTime] = e.target.value.split('-');
                      const slot = availableSlots.find(s => 
                        s.slotNumber.toString() === slotNumber && 
                        s.startTime === startTime && 
                        s.endTime === endTime
                      );
                      setSelectedSlot(slot || null);
                    } else {
                      setSelectedSlot(null);
                    }
                  }}
                  disabled={availableSlots.length === 0}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">
                    {availableSlots.length === 0 
                      ? (selectedSubject && selectedDate ? 'No slots available for this date' : 'Select subject and date first') 
                      : 'Select Time Slot'}
                  </option>
                  {availableSlots.map((slot, index) => (
                    <option 
                      key={index} 
                      value={`${slot.slotNumber}-${slot.startTime}-${slot.endTime}`}
                    >
                      Period {slot.slotNumber}: {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
                {/* Debug info */}
                <div style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  fontSize: '0.8rem', 
                  marginTop: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  Available slots: {availableSlots.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSubject && students.length > 0 && (
          <>
            {/* Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '1.25rem', 
              marginBottom: '2rem' 
            }}>
              <div className="glass-card" style={{ 
                textAlign: 'center',
                padding: '1.5rem'
              }}>
                <div style={{ 
                  color: 'white', 
                  fontSize: '2.2rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  {students.length}
                </div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '1rem'
                }}>
                  Total Students
                </div>
              </div>
              <div className="glass-card" style={{ 
                textAlign: 'center', 
                background: 'rgba(76, 209, 55, 0.1)',
                padding: '1.5rem'
              }}>
                <div style={{ 
                  color: '#4cd137', 
                  fontSize: '2.2rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  {presentCount}
                </div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '1rem'
                }}>
                  Present
                </div>
              </div>
              <div className="glass-card" style={{ 
                textAlign: 'center', 
                background: 'rgba(255, 107, 107, 0.1)',
                padding: '1.5rem'
              }}>
                <div style={{ 
                  color: '#ff6b6b', 
                  fontSize: '2.2rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  {absentCount}
                </div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '1rem'
                }}>
                  Absent
                </div>
              </div>
              <div className="glass-card" style={{ 
                textAlign: 'center',
                padding: '1.5rem'
              }}>
                <div style={{ 
                  color: 'white', 
                  fontSize: '2.2rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
                </div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '1rem'
                }}>
                  Attendance
                </div>
              </div>
            </div>

            {/* Mode Toggle */}
            <div style={{ 
              display: 'flex', 
              gap: '1.25rem', 
              marginBottom: '2rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUseFaceRecognition(false)}
                className="glass-button"
                style={{ 
                  padding: '0.85rem 2rem', 
                  background: useFaceRecognition ? 'rgba(255,255,255,0.1)' : 'rgba(76, 209, 55, 0.3)',
                  border: useFaceRecognition ? '1px solid rgba(255,255,255,0.3)' : '1px solid #4cd137',
                  minWidth: '180px'
                }}
              >
                Manual Attendance
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUseFaceRecognition(true)}
                className="glass-button"
                style={{ 
                  padding: '0.85rem 2rem', 
                  background: useFaceRecognition ? 'rgba(76, 209, 55, 0.3)' : 'rgba(255,255,255,0.1)',
                  border: useFaceRecognition ? '1px solid #4cd137' : '1px solid rgba(255,255,255,0.3)',
                  minWidth: '180px'
                }}
              >
                Face Recognition
              </motion.button>
            </div>

            {/* Face Recognition Mode */}
            {useFaceRecognition ? (
              <div className="glass-card" style={{ 
                padding: '2rem', 
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <h3 style={{ 
                  color: 'white', 
                  marginBottom: '1.25rem',
                  fontSize: '1.5rem'
                }}>
                  Face Recognition Attendance
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  marginBottom: '2rem',
                  fontSize: '1.05rem',
                  maxWidth: '600px',
                  margin: '0 auto 2rem auto'
                }}>
                  Position the student in front of the camera and click "Mark Attendance" to recognize and mark attendance.
                </p>
                <FaceRecognitionCapture 
                  subjectId={selectedSubject}
                  onAttendanceMarked={handleFaceRecognitionAttendance}
                />
              </div>
            ) : (
              <>
                {/* Quick Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1.25rem', 
                  marginBottom: '2rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMarkAll('present')}
                    className="glass-button"
                    style={{ 
                      padding: '0.85rem 2rem', 
                      background: 'rgba(76, 209, 55, 0.2)',
                      minWidth: '160px'
                    }}
                  >
                    Mark All Present
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMarkAll('absent')}
                    className="glass-button"
                    style={{ 
                      padding: '0.85rem 2rem', 
                      background: 'rgba(255, 107, 107, 0.2)',
                      minWidth: '160px'
                    }}
                  >
                    Mark All Absent
                  </motion.button>
                </div>
              </>
            )}

            {/* Students List - only show in manual mode */}
            {!useFaceRecognition && (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {attendanceData.map((item, index) => (
                    <motion.div
                      key={item.studentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.25rem',
                        borderBottom: index < attendanceData.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: 'white', 
                          fontWeight: '500',
                          fontSize: '1.05rem',
                          marginBottom: '0.25rem'
                        }}>
                          {item.student.name}
                        </div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.6)', 
                          fontSize: '0.9rem' 
                        }}>
                          {item.student.universityId || item.student.email}
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleAttendance(item.studentId)}
                        disabled={item.marked}
                        style={{
                          padding: '0.65rem 1.75rem',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: item.marked ? 'not-allowed' : 'pointer',
                          background: item.status === 'present' 
                            ? 'rgba(76, 209, 55, 0.3)' 
                            : 'rgba(255, 107, 107, 0.3)',
                          color: 'white',
                          fontWeight: 'bold',
                          opacity: item.marked ? 0.6 : 1,
                          minWidth: '120px',
                          textAlign: 'center'
                        }}
                      >
                        {item.status === 'present' ? '✓ Present' : '✗ Absent'}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>

                <div style={{ 
                  marginTop: '1.75rem', 
                  paddingTop: '1.75rem', 
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitAttendance}
                    disabled={loading || !selectedSlot}
                    className="glass-button"
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      padding: '1.1rem',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      opacity: loading || !selectedSlot ? 0.6 : 1,
                      cursor: loading || !selectedSlot ? 'not-allowed' : 'pointer',
                      margin: '0 auto'
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Attendance'}
                  </motion.button>
                </div>
              </div>
            )}
          </>
        )}

        {selectedSubject && students.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
            No students found for this subject
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AdminAttendanceMarking;
