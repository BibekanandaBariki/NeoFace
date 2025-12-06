import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';import api from '../utils/api';
import GlassCard from './GlassCard';
import '../styles/glassmorphism.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BREAK_TYPES = [
  { value: 'short', label: 'Short Break' },
  { value: 'lunch', label: 'Lunch Break' },
  { value: 'none', label: 'No Break' }
];

const WeeklyTimetableGenerator = ({ onBack }) => {
  // Step 1: Selection states
  const [step, setStep] = useState(1); // 1: Selection, 2: Configuration, 3: Generation
  const [selectionData, setSelectionData] = useState({
    university: '',
    campus: '',
    school: '',
    program: '',
    course: '',
    branch: '',
    batch: '',
    semester: '',
    section: '',
    effectiveFrom: ''
  });

  // Hierarchical data
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  // Remove unused state variable
  // const [sections, setSections] = useState([]);  // Step 2: Configuration data
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  // Remove unused state variable
  // const [rooms, setRooms] = useState([]);
  const [configuration, setConfiguration] = useState({
    dailyHours: {
      startTime: '09:30',
      endTime: '17:30'
    },
    offDay: 'Sunday',
    breaks: [
      { day: 'Monday', startTime: '11:00', endTime: '11:15', type: 'short' },
      { day: 'Monday', startTime: '13:00', endTime: '14:00', type: 'lunch' }
    ],
    teacherAvailability: [],
    roomAvailability: [],
    rooms: [] // Add rooms array
  });

  // Step 3: Generation data
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Remove unused state variable
  // const [success, setSuccess] = useState('');

  // Add state for subject weekly classes configuration
  const [subjectWeeklyClasses, setSubjectWeeklyClasses] = useState({});

  // Fetch hierarchical data
  const fetchUniversities = async () => {
    try {
      const response = await api.get('/universities?isActive=true');
      setUniversities(response.data);
    } catch (error) {
      console.error('Error fetching universities:', error);
      setError('Failed to load universities');
    }
  };

  const fetchCampuses = async (universityId) => {
    if (!universityId) {
      setCampuses([]);
      return;
    }
    try {
      const response = await api.get(`/campus?university=${universityId}&isActive=true`);
      setCampuses(response.data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      setError('Failed to load campuses');
    }
  };

  const fetchSchools = async (campusId) => {
    if (!campusId) {
      setSchools([]);
      return;
    }
    try {
      const response = await api.get(`/schools?campus=${campusId}&isActive=true`);
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setError('Failed to load schools');
    }
  };

  const fetchPrograms = async (schoolId) => {
    if (!schoolId) {
      setPrograms([]);
      return;
    }
    try {
      const response = await api.get(`/programs?school=${schoolId}&isActive=true`);
      setPrograms(response.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load programs');
    }
  };

  const fetchCourses = async (programId) => {
    if (!programId) {
      setCourses([]);
      return;
    }
    try {
      const response = await api.get(`/courses?program=${programId}&isActive=true`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    }
  };

  const fetchBranches = async (courseId) => {
    if (!courseId) {
      setBranches([]);
      return;
    }
    try {
      const response = await api.get(`/branches?course=${courseId}&isActive=true`);
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to load branches');
    }
  };

  const fetchBatches = async (branchId) => {
    if (!branchId) {
      setBatches([]);
      return;
    }
    try {
      const response = await api.get(`/batches?branch=${branchId}&isActive=true`);
      setBatches(response.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to load batches');
    }
  };

  const fetchSemesters = async (branchId) => {
    if (!branchId) {
      setSemesters([]);
      return;
    }
    try {
      const response = await api.get(`/semesters?branch=${branchId}&isActive=true`);
      setSemesters(response.data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      setError('Failed to load semesters');
    }
  };

  // Remove unused function
  // const fetchSections = async (semesterId) => {
  //   if (!semesterId) {
  //     setSections([]);
  //     return;
  //   }
  //   try {
  //     // Fetch the semester details to get the section
  //     const response = await api.get(`/semesters/${semesterId}`);
  //     if (response.data && response.data.section) {
  //       setSections([response.data.section]);
  //     } else {
  //       setSections([]);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching sections:', error);
  //     setError('Failed to load sections');
  //   }
  // };

  // Remove unused function
  // const fetchSubjectsAndTeachers = async (branchId, semesterNumber) => {
  //   if (!branchId || !semesterNumber) {
  //     setSubjects([]);
  //     setTeachers([]);
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     setError('');

  //     // Fetch subjects
  //     const subjectsResponse = await api.get(`/subjects?branch=${branchId}&semester=${semesterNumber}`);
      
  //     // Fetch teachers (faculty members)
  //     const teachersResponse = await api.get('/users?role=admin'); // Assuming teachers are stored as admins

  //     setSubjects(subjectsResponse.data);
  //     setTeachers(teachersResponse.data);

  //     // Initialize subject weekly classes with default value of 3
  //     const initialWeeklyClasses = {};
  //     subjectsResponse.data.forEach(subject => {
  //       initialWeeklyClasses[subject._id] = 3; // Default to 3 classes per week
  //     });
  //     setSubjectWeeklyClasses(initialWeeklyClasses);

  //   } catch (error) {
  //     console.error('Error fetching subjects and teachers:', error);
  //     setError('Failed to load subjects and teachers: ' + (error.response?.data?.message || error.message));
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // Initialize data on component mount
  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  // Handle selection changes
  const handleSelectionChange = (field, value) => {
    setSelectionData({ ...selectionData, [field]: value });
    
    // Reset dependent fields
    switch (field) {
      case 'university':
        setSelectionData(prev => ({ ...prev, campus: '', school: '', program: '', course: '', branch: '', batch: '', semester: '' }));
        fetchCampuses(value);
        break;
      case 'campus':
        setSelectionData(prev => ({ ...prev, school: '', program: '', course: '', branch: '', batch: '', semester: '' }));
        fetchSchools(value);
        break;
      case 'school':
        setSelectionData(prev => ({ ...prev, program: '', course: '', branch: '', batch: '', semester: '' }));
        fetchPrograms(value);
        break;
      case 'program':
        setSelectionData(prev => ({ ...prev, course: '', branch: '', batch: '', semester: '' }));
        fetchCourses(value);
        break;
      case 'course':
        setSelectionData(prev => ({ ...prev, branch: '', batch: '', semester: '' }));
        fetchBranches(value);
        break;
      case 'branch':
        setSelectionData(prev => ({ ...prev, batch: '', semester: '' }));
        fetchBatches(value);
        fetchSemesters(value);
        break;
      case 'batch':
        setSelectionData(prev => ({ ...prev, semester: '' }));
        break;
      case 'semester':
        setSelectionData(prev => ({ ...prev, section: '' }));
        {/* fetchSections(value); */}
        break;
      default:
        break;
    }
  };

  // Proceed to next step
  const nextStep = async () => {
    if (step === 1) {
      // Validate selection
      if (!selectionData.university || !selectionData.campus || !selectionData.school || 
          !selectionData.program || !selectionData.course || !selectionData.branch || 
          !selectionData.batch || !selectionData.semester || !selectionData.section || 
          !selectionData.effectiveFrom) {
        setError('Please fill in all selection fields');
        return;
      }
      
      // Fetch subjects and teachers for the selected semester/section
      try {
        setLoading(true);
        setError('');
        
        // Get the selected semester object to extract the semester number
        const selectedSemester = semesters.find(s => s._id === selectionData.semester);
        const semesterNumber = selectedSemester ? selectedSemester.semesterNumber : selectionData.semester;
        
        console.log('Fetching subjects for:', {
          branch: selectionData.branch,
          semester: semesterNumber
        });
        
        // Fetch subjects for this semester and section
        const subjectsRes = await api.get(`/api/subjects?branch=${selectionData.branch}&semester=${semesterNumber}`);
        console.log('Subjects response:', subjectsRes.data);
        setSubjects(subjectsRes.data);
        
        // Extract unique teachers from subjects
        const allTeachers = [];
        subjectsRes.data.forEach(subject => {
          if (subject.faculty && subject.faculty.length > 0) {
            subject.faculty.forEach(fac => {
              if (fac.teacher && !allTeachers.find(t => t._id === fac.teacher._id)) {
                allTeachers.push(fac.teacher);
              }
            });
          }
        });
        console.log('Extracted teachers:', allTeachers);
        setTeachers(allTeachers);
        
        setStep(2);
      } catch (err) {
        console.error('Failed to load subjects and teachers:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
        setError(`Failed to load subjects and teachers: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      // Validate configuration and generate timetable
      // Calculate total classes to be scheduled
      let totalClasses = 0;
      subjects.forEach(subject => {
        const requiredClasses = subjectWeeklyClasses[subject._id] || 3;
        totalClasses += requiredClasses;
      });
      
      if (totalClasses === 0) {
        setError('Please specify at least one class for subjects');
        return;
      }
      
      // Generate timetable automatically when moving to Step 3
      await generateTimetable();
      setStep(3);
    }
  };

  // Go back to previous step
  const prevStep = () => {
    setStep(step - 1);
  };

  // Handle configuration changes
  const handleConfigChange = (field, value) => {
    setConfiguration({ ...configuration, [field]: value });
  };

  const handleDailyHoursChange = (field, value) => {
    setConfiguration({
      ...configuration,
      dailyHours: { ...configuration.dailyHours, [field]: value }
    });
  };

  const handleAddBreak = () => {
    setConfiguration({
      ...configuration,
      breaks: [...configuration.breaks, { day: 'Monday', startTime: '11:00', endTime: '11:15', type: 'short' }]
    });
  };

  const handleRemoveBreak = (index) => {
    const newBreaks = [...configuration.breaks];
    newBreaks.splice(index, 1);
    setConfiguration({ ...configuration, breaks: newBreaks });
  };

  const handleBreakChange = (index, field, value) => {
    const newBreaks = [...configuration.breaks];
    newBreaks[index][field] = value;
    setConfiguration({ ...configuration, breaks: newBreaks });
  };

  const handleAddTeacherAvailability = () => {
    setConfiguration({
      ...configuration,
      teacherAvailability: [...configuration.teacherAvailability, { 
        teacherId: '', 
        day: 'Monday', 
        startTime: '09:30', 
        endTime: '11:30' 
      }]
    });
  };

  const handleRemoveTeacherAvailability = (index) => {
    const newAvailability = [...configuration.teacherAvailability];
    newAvailability.splice(index, 1);
    setConfiguration({ ...configuration, teacherAvailability: newAvailability });
  };

  const handleTeacherAvailabilityChange = (index, field, value) => {
    const newAvailability = [...configuration.teacherAvailability];
    newAvailability[index][field] = value;
    setConfiguration({ ...configuration, teacherAvailability: newAvailability });
  };

  const handleAddRoomAvailability = () => {
    setConfiguration({
      ...configuration,
      roomAvailability: [...configuration.roomAvailability, { 
        roomId: '', 
        day: 'Monday', 
        startTime: '09:30', 
        endTime: '17:30' 
      }]
    });
  };

  const handleRemoveRoomAvailability = (index) => {
    const newAvailability = [...configuration.roomAvailability];
    newAvailability.splice(index, 1);
    setConfiguration({ ...configuration, roomAvailability: newAvailability });
  };

  const handleRoomAvailabilityChange = (index, field, value) => {
    const newAvailability = [...configuration.roomAvailability];
    newAvailability[index][field] = value;
    setConfiguration({ ...configuration, roomAvailability: newAvailability });
  };

  // Handle room changes
  const handleRoomChange = (index, field, value) => {
    const newRooms = [...configuration.rooms];
    newRooms[index][field] = value;
    setConfiguration({ ...configuration, rooms: newRooms });
  };

  const handleAddRoom = () => {
    setConfiguration({
      ...configuration,
      rooms: [...configuration.rooms, { 
        id: Date.now().toString(), 
        name: '', 
        type: 'Theory' 
      }]
    });
  };

  const handleRemoveRoom = (index) => {
    const newRooms = [...configuration.rooms];
    newRooms.splice(index, 1);
    setConfiguration({ ...configuration, rooms: newRooms });
  };

  // Initialize subject weekly classes when subjects are loaded
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const initialClasses = {};
      subjects.forEach(subject => {
        // Default to 3 classes per week if not previously set
        initialClasses[subject._id] = subjectWeeklyClasses[subject._id] || 3;
      });
      setSubjectWeeklyClasses(prev => {
        // Only update if subjects changed (avoid unnecessary updates)
        const hasChanges = subjects.some(subject => 
          !(subject._id in prev) || prev[subject._id] !== (initialClasses[subject._id] || 3)
        );
        return hasChanges ? { ...prev, ...initialClasses } : prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  // Handle subject weekly class count change
  const handleSubjectClassCountChange = (subjectId, count) => {
    setSubjectWeeklyClasses({
      ...subjectWeeklyClasses,
      [subjectId]: count
    });
  };

  // Generate timetable
  const generateTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate that rooms are provided
      if (!configuration.rooms || configuration.rooms.length === 0) {
        setError('Please add at least one room before generating the timetable');
        setLoading(false);
        return;
      }
      
      // Validate that all rooms have names
      const emptyRoom = configuration.rooms.find(room => !room.name.trim());
      if (emptyRoom) {
        setError('Please provide names for all rooms');
        setLoading(false);
        return;
      }
      
      // Get the selected semester object to extract the semester number
      const selectedSemester = semesters.find(s => s._id === selectionData.semester);
      const semesterNumber = selectedSemester ? selectedSemester.semesterNumber : selectionData.semester;
      
      // Calculate total classes to be scheduled
      let totalClasses = 0;
      subjects.forEach(subject => {
        const requiredClasses = subjectWeeklyClasses[subject._id] || 3;
        totalClasses += requiredClasses;
      });
      
      // Prepare data for timetable generation
      const generationData = {
        university: selectionData.university,
        campus: selectionData.campus,
        school: selectionData.school,
        program: selectionData.program,
        course: selectionData.course,
        branch: selectionData.branch,
        batch: selectionData.batch,
        semester: semesterNumber,
        section: selectionData.section,
        effectiveFrom: selectionData.effectiveFrom,
        configuration: configuration,
        subjectWeeklyClasses: subjectWeeklyClasses
      };
      
      // Call the backend API to generate the timetable
      const response = await api.post('/timetables/generate', generationData);
      
      if (response.data.success) {
        setGeneratedTimetable(response.data.timetable);
        const scheduled = response.data.timetable.totalPeriods;
        const requested = totalClasses;
        // Handle conflict report
        let errorMessage = response.data.message || 'Failed to generate timetable';
        if (response.data.issues && response.data.issues.length > 0) {
          errorMessage += '\n\nIssues:\n' + response.data.issues.join('\n');
        }
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          errorMessage += '\n\nSuggestions:\n' + response.data.suggestions.join('\n');
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Timetable generation error:', err);
      setError('Failed to generate timetable: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Save timetable
  const saveTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the selected semester object to extract the semester number
      const selectedSemester = semesters.find(s => s._id === selectionData.semester);
      const semesterNumber = selectedSemester ? selectedSemester.semesterNumber : selectionData.semester;
      
      // Prepare timetable data for saving
      const timetableData = {
        campus: selectionData.campus,
        program: selectionData.program,
        branch: selectionData.branch,
        batch: selectionData.batch,
        section: selectionData.section,
        semester: selectionData.semester,
        semesterNumber: semesterNumber,
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        effectiveFrom: selectionData.effectiveFrom,
        schedule: generatedTimetable.schedule
      };
      
      await api.post('/timetables', timetableData);
      {/* setSuccess('Timetable saved successfully!'); */}
    } catch (err) {
      setError('Failed to save timetable: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Weekly Timetable Generator</h1>
        {onBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ← Back to Timetable Management
          </motion.button>
        )}
      </div>
      
      {/* Progress indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '2rem',
        maxWidth: '600px'
      }}>
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: step >= stepNum ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255,255,255,0.1)',
              border: step >= stepNum ? '2px solid #4cd137' : '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: step >= stepNum ? '#4cd137' : 'rgba(255,255,255,0.5)',
              fontWeight: 'bold',
              marginRight: '10px'
            }}>
              {stepNum}
            </div>
            <span style={{ 
              color: step >= stepNum ? 'white' : 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem'
            }}>
              {stepNum === 1 ? 'Selection' : stepNum === 2 ? 'Configuration' : 'Generation'}
            </span>
            {stepNum < 3 && (
              <div style={{
                width: '40px',
                height: '2px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                margin: '0 10px'
              }}></div>
            )}
          </div>
        ))}
      </div>

      {/* Error and success messages */}
      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(231, 76, 60, 0.2)',
          borderRadius: '8px',
          color: '#e74c3c',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      
      {/* {success && (
        <div style={{
          padding: '1rem',
          background: 'rgba(46, 204, 113, 0.2)',
          borderRadius: '8px',
          color: '#2ecc71',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )} */}

      {/* Step 1: Selection */}
      {step === 1 && (
        <GlassCard>
          <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Step 1: Select Academic Details</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {/* University */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                University *
              </label>
              <select
                value={selectionData.university}
                onChange={(e) => handleSelectionChange('university', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none'
                }}
              >
                <option value="">Select University</option>
                {universities.map(university => (
                  <option key={university._id} value={university._id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campus */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                Campus *
              </label>
              <select
                value={selectionData.campus}
                onChange={(e) => handleSelectionChange('campus', e.target.value)}
                disabled={!selectionData.university}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  opacity: selectionData.university ? 1 : 0.5
                }}
              >
                <option value="">Select Campus</option>
                {campuses.map(campus => (
                  <option key={campus._id} value={campus._id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>

            {/* School */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                School *
              </label>
              <select
                value={selectionData.school}
                onChange={(e) => handleSelectionChange('school', e.target.value)}
                disabled={!selectionData.campus}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  opacity: selectionData.campus ? 1 : 0.5
                }}
              >
                <option value="">Select School</option>
                {schools.map(school => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Program */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                Program *
              </label>
              <select
                value={selectionData.program}
                onChange={(e) => handleSelectionChange('program', e.target.value)}
                disabled={!selectionData.school}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  opacity: selectionData.school ? 1 : 0.5
                }}
              >
                <option value="">Select Program</option>
                {programs.map(program => (
                  <option key={program._id} value={program._id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                Course *
              </label>
              <select
                value={selectionData.course}
                onChange={(e) => handleSelectionChange('course', e.target.value)}
                disabled={!selectionData.program}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  opacity: selectionData.program ? 1 : 0.5
                }}
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                Branch *
              </label>
              <select
                value={selectionData.branch}
                onChange={(e) => handleSelectionChange('branch', e.target.value)}
                disabled={!selectionData.course}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  opacity: selectionData.course ? 1 : 0.5
                }}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                Batch *
              </label>
              <select
                value={selectionData.batch}
                onChange={(e) => handleSelectionChange('batch', e.target.value)}
                disabled={!selectionData.branch}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  opacity: selectionData.branch ? 1 : 0.5
                }}
              >
                <option value="">Select Batch</option>
                {batches.map(batch => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name || `Batch ${batch.year}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                Semester *
              </label>
              <select
                value={selectionData.semester}
                onChange={(e) => handleSelectionChange('semester', e.target.value)}
                disabled={!selectionData.branch}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  opacity: selectionData.branch ? 1 : 0.5
                }}
              >
                <option value="">Select Semester</option>
                {semesters.map(semester => (
                  <option key={semester._id} value={semester._id}>
                    Semester {semester.semesterNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                Section *
              </label>
              <input
                type="text"
                value={selectionData.section}
                onChange={(e) => handleSelectionChange('section', e.target.value.toUpperCase())}
                placeholder="A, B, C..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  textTransform: 'uppercase'
                }}
              />
            </div>

            {/* Effective From */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                Effective From *
              </label>
              <input
                type="date"
                value={selectionData.effectiveFrom}
                onChange={(e) => handleSelectionChange('effectiveFrom', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(76, 209, 55, 0.2)',
                border: '1px solid #4cd137',
                borderRadius: '8px',
                color: '#4cd137',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Loading...' : 'Next Step'}
            </motion.button>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Configuration */}
      {step === 2 && (
        <GlassCard>
          <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Step 2: Configure Timetable Settings</h2>
          
          {/* Subjects and Teachers Info */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Subjects and Teachers</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {subjects.map(subject => (
                <div key={subject._id} style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <h4 style={{ color: 'white', margin: 0 }}>{subject.name}</h4>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      background: 'rgba(76, 209, 55, 0.2)', 
                      borderRadius: '4px',
                      color: '#4cd137',
                      fontSize: '0.8rem'
                    }}>
                      {subject.code}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      {subject.faculty && subject.faculty.length > 0 ? (
                        <div>
                          Faculty: {subject.faculty.map(f => f.teacher?.name).join(', ')}
                        </div>
                      ) : (
                        <div style={{ color: '#e74c3c' }}>No faculty assigned</div>
                      )}
                    </div>
                    <div style={{ 
                      padding: '0.25rem 0.5rem', 
                      background: 'rgba(52, 152, 219, 0.2)', 
                      borderRadius: '4px',
                      color: '#3498db',
                      fontSize: '0.8rem'
                    }}>
                      {subject.credits} Credits
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Hours */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Daily Hours</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={configuration.dailyHours.startTime}
                  onChange={(e) => handleDailyHoursChange('startTime', e.target.value)}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={configuration.dailyHours.endTime}
                  onChange={(e) => handleDailyHoursChange('endTime', e.target.value)}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Off Day */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Off Day</h3>
            <select
              value={configuration.offDay}
              onChange={(e) => handleConfigChange('offDay', e.target.value)}
              style={{
                padding: '0.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none'
              }}
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* Breaks */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>Breaks</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddBreak}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(52, 152, 219, 0.2)',
                  border: '1px solid #3498db',
                  borderRadius: '8px',
                  color: '#3498db',
                  cursor: 'pointer'
                }}
              >
                Add Break
              </motion.button>
            </div>
            
            {configuration.breaks.map((breakItem, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                gap: '1rem', 
                alignItems: 'center',
                marginBottom: '1rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px'
              }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                    Day
                  </label>
                  <select
                    value={breakItem.day}
                    onChange={(e) => handleBreakChange(index, 'day', e.target.value)}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={breakItem.startTime}
                    onChange={(e) => handleBreakChange(index, 'startTime', e.target.value)}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={breakItem.endTime}
                    onChange={(e) => handleBreakChange(index, 'endTime', e.target.value)}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                    Type
                  </label>
                  <select
                    value={breakItem.type}
                    onChange={(e) => handleBreakChange(index, 'type', e.target.value)}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    {BREAK_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRemoveBreak(index)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(231, 76, 60, 0.2)',
                    border: '1px solid #e74c3c',
                    borderRadius: '8px',
                    color: '#e74c3c',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </motion.button>
              </div>
            ))}
          </div>

          {/* Teacher Availability */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>Teacher Availability</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddTeacherAvailability}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(52, 152, 219, 0.2)',
                  border: '1px solid #3498db',
                  borderRadius: '8px',
                  color: '#3498db',
                  cursor: 'pointer'
                }}
              >
                Add Availability
              </motion.button>
            </div>
            
            {configuration.teacherAvailability.length === 0 ? (
              <div style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center'
              }}>
                No teacher availability constraints set. Teachers will be considered available during college hours by default.
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gap: '1rem'
              }}>
                {configuration.teacherAvailability.map((availability, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Teacher
                      </label>
                      <select
                        value={availability.teacherId}
                        onChange={(e) => handleTeacherAvailabilityChange(index, 'teacherId', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map(teacher => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Day
                      </label>
                      <select
                        value={availability.day}
                        onChange={(e) => handleTeacherAvailabilityChange(index, 'day', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      >
                        {DAYS.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={availability.startTime}
                        onChange={(e) => handleTeacherAvailabilityChange(index, 'startTime', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        End Time
                      </label>
                      <input
                        type="time"
                        value={availability.endTime}
                        onChange={(e) => handleTeacherAvailabilityChange(index, 'endTime', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRemoveTeacherAvailability(index)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(231, 76, 60, 0.2)',
                        border: '1px solid #e74c3c',
                        borderRadius: '8px',
                        color: '#e74c3c',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rooms Configuration */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>Rooms</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddRoom}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(46, 204, 113, 0.2)',
                  border: '1px solid #2ecc71',
                  borderRadius: '8px',
                  color: '#2ecc71',
                  cursor: 'pointer'
                }}
              >
                Add Room
              </motion.button>
            </div>
            
            {configuration.rooms.length === 0 ? (
              <div style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center'
              }}>
                No rooms added. Please add rooms to be used in the timetable.
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gap: '1rem'
              }}>
                {configuration.rooms.map((room, index) => (
                  <div key={room.id} style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Room Name/Number
                      </label>
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => handleRoomChange(index, 'name', e.target.value)}
                        placeholder="e.g., Room 101"
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Room Type
                      </label>
                      <select
                        value={room.type}
                        onChange={(e) => handleRoomChange(index, 'type', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      >
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                        <option value="Seminar">Seminar</option>
                      </select>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRemoveRoom(index)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(231, 76, 60, 0.2)',
                        border: '1px solid #e74c3c',
                        borderRadius: '8px',
                        color: '#e74c3c',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room Availability */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>Room Availability</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddRoomAvailability}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(155, 89, 182, 0.2)',
                  border: '1px solid #9b59b6',
                  borderRadius: '8px',
                  color: '#9b59b6',
                  cursor: 'pointer'
                }}
              >
                Add Room Availability
              </motion.button>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(52, 152, 219, 0.1)', 
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid rgba(52, 152, 219, 0.3)'
            }}>
              <h4 style={{ 
                color: '#3498db', 
                margin: '0 0 0.5rem 0',
                fontSize: '1rem'
              }}>
                Availability Constraints
              </h4>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                margin: 0,
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                <strong>Teacher Availability:</strong> If no availability is set for a teacher, they will be considered available during college hours. 
                Set specific availability to restrict when teachers can be scheduled.
              </p>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                margin: '0.5rem 0 0 0',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                <strong>Room Availability:</strong> If no constraints are set, all rooms are considered available during college hours. 
                Add unavailable periods to prevent rooms from being scheduled during maintenance or other activities.
              </p>
            </div>
            
            {configuration.roomAvailability.length === 0 ? (
              <div style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center'
              }}>
                No room availability constraints set. All rooms will be considered available during college hours by default.
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gap: '1rem'
              }}>
                {configuration.roomAvailability.map((availability, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Room
                      </label>
                      <select
                        value={availability.roomId}
                        onChange={(e) => handleRoomAvailabilityChange(index, 'roomId', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select Room</option>
                        {configuration.rooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} ({room.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Day
                      </label>
                      <select
                        value={availability.day}
                        onChange={(e) => handleRoomAvailabilityChange(index, 'day', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      >
                        {DAYS.filter(day => day !== configuration.offDay).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={availability.startTime}
                        onChange={(e) => handleRoomAvailabilityChange(index, 'startTime', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        End Time
                      </label>
                      <input
                        type="time"
                        value={availability.endTime}
                        onChange={(e) => handleRoomAvailabilityChange(index, 'endTime', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRemoveRoomAvailability(index)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(231, 76, 60, 0.2)',
                        border: '1px solid #e74c3c',
                        borderRadius: '8px',
                        color: '#e74c3c',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject Weekly Classes Configuration */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>Subject Weekly Classes</h3>
              <div style={{ 
                display: 'flex',
                gap: '1rem'
              }}>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'rgba(46, 204, 113, 0.2)', 
                  borderRadius: '8px',
                  color: '#2ecc71',
                  fontSize: '0.9rem'
                }}>
                  {subjects.length} subjects
                </div>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'rgba(52, 152, 219, 0.2)', 
                  borderRadius: '8px',
                  color: '#3498db',
                  fontSize: '0.9rem'
                }}>
                  {/* Calculate total classes */}
                  {subjects.reduce((total, subject) => {
                    const requiredClasses = subjectWeeklyClasses[subject._id] || 3;
                    return total + requiredClasses;
                  }, 0)} total classes
                </div>
              </div>
            </div>
            
            {subjects.length === 0 ? (
              <div style={{ 
                padding: '2rem', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.6)'
              }}>
                No subjects found for this semester. Please go back and verify your selection.
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '1rem'
              }}>
                {subjects.map(subject => (
                  <div key={subject._id} style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <h4 style={{ 
                          color: 'white', 
                          margin: 0, 
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}>
                          {subject.name}
                        </h4>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.7)', 
                          fontSize: '0.85rem',
                          marginTop: '0.25rem'
                        }}>
                          {subject.code}
                        </div>
                      </div>
                      
                      <div style={{ 
                        padding: '0.25rem 0.75rem', 
                        background: 'rgba(52, 152, 219, 0.2)', 
                        borderRadius: '12px',
                        color: '#3498db',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {subject.credits} Credits
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{ 
                        color: 'rgba(255,255,255,0.7)', 
                        fontSize: '0.9rem',
                        minWidth: '120px'
                      }}>
                        Weekly Classes:
                      </div>
                      
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={subjectWeeklyClasses[subject._id] || 3}
                        onChange={(e) => handleSubjectClassCountChange(subject._id, parseInt(e.target.value) || 3)}
                        style={{
                          width: '80px',
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                      
                      <div style={{ 
                        color: 'rgba(255,255,255,0.5)', 
                        fontSize: '0.85rem'
                      }}>
                        periods
                      </div>
                    </div>
                    
                    {subject.faculty && subject.faculty.length > 0 && (
                      <div style={{ 
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.7)', 
                          fontSize: '0.85rem',
                          marginBottom: '0.25rem'
                        }}>
                          Faculty:
                        </div>
                        <div style={{ 
                          color: 'white', 
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {subject.faculty.map(f => f.teacher?.name || 'Unknown Teacher').join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevStep}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Previous
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(76, 209, 55, 0.2)',
                border: '1px solid #4cd137',
                borderRadius: '8px',
                color: '#4cd137',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Generating...' : 'Generate Timetable'}
            </motion.button>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Generation */}
      {step === 3 && (
        <GlassCard>
          <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Step 3: Generated Timetable</h2>
          
          {generatedTimetable ? (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <div>
                  <h3 style={{ color: 'white', margin: 0 }}>
                    {branches.find(b => b._id === selectionData.branch)?.name || 'Branch'} - Section {selectionData.section}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.5rem 0 0 0' }}>
                    Semester {semesters.find(s => s._id === selectionData.semester)?.semesterNumber || selectionData.semester}
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveTimetable}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(76, 209, 55, 0.2)',
                    border: '1px solid #4cd137',
                    borderRadius: '8px',
                    color: '#4cd137',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Saving...' : 'Save Timetable'}
                </motion.button>
              </div>
              
              {/* Display generated timetable */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {generatedTimetable.schedule.map((daySchedule) => (
                  <motion.div
                    key={daySchedule.dayOfWeek}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{ color: 'white', margin: 0 }}>{daySchedule.dayName}</h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        background: daySchedule.slots.length > 0 ? 'rgba(76, 209, 55, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: daySchedule.slots.length > 0 ? '#4cd137' : 'rgba(255,255,255,0.5)'
                      }}>
                        {daySchedule.slots.length} {daySchedule.slots.length === 1 ? 'period' : 'periods'}
                      </span>
                    </div>
                    
                    {daySchedule.slots.length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', textAlign: 'center' }}>
                        No classes scheduled
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {daySchedule.slots.map((slot, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            style={{
                              padding: '1rem',
                              background: slot.isBreak ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              borderLeft: slot.isBreak ? '3px solid rgba(255,255,255,0.3)' : '3px solid #4cd137'
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'center' }}>
                              <div>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                                  Period {slot.slotNumber}
                                </div>
                              </div>
                              
                              {slot.isBreak ? (
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                  {slot.breakType === 'lunch' ? 'Lunch Break' : 'Break'}
                                </div>
                              ) : (
                                <div>
                                  <div style={{ color: 'white', fontWeight: 'bold' }}>
                                    {slot.subjectCode || 'No Code'} - {slot.subjectName || 'No Name'}
                                  </div>
                                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                    Faculty: {slot.facultyName || 'TBA'}
                                  </div>
                                </div>
                              )}
                              
                              {slot.room && (
                                <div style={{
                                  padding: '0.5rem 1rem',
                                  background: 'rgba(76, 209, 55, 0.2)',
                                  borderRadius: '6px',
                                  color: '#4cd137',
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold'
                                }}>
                                  {slot.room}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateTimetable}
                disabled={loading}
                style={{
                  padding: '1rem 2rem',
                  background: 'rgba(76, 209, 55, 0.2)',
                  border: '1px solid #4cd137',
                  borderRadius: '8px',
                  color: '#4cd137',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Generating Timetable...' : 'Generate Timetable'}
              </motion.button>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevStep}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Previous
            </motion.button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default WeeklyTimetableGenerator;