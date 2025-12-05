import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import api from '../utils/api';

const SuperAdminOverride = () => {
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStatus, setNewStatus] = useState('present');
  const [remarks, setRemarks] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [filters, setFilters] = useState({
    university: '',
    campus: '',
    school: '',
    program: '',
    course: '',
    batch: '',
    section: '',
    subject: '',
    date: ''
  });

  useEffect(() => {
    fetchUniversities();
    fetchCampuses();
    fetchSchools();
    fetchPrograms();
    fetchCourses();
    fetchBatches();
    fetchSubjects();
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

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects?isActive=true');
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAttendanceRecord = async () => {
    try {
      setLoading(true);
      const params = {
        university: filters.university,
        campus: filters.campus,
        school: filters.school,
        program: filters.program,
        course: filters.course,
        batch: filters.batch,
        subject: filters.subject,
        date: filters.date
      };
      
      const { data } = await api.get('/superadmin/attendance/record', { params });
      setAttendanceRecord(data);
    } catch (error) {
      console.error('Error fetching attendance record:', error);
      setError('Failed to fetch attendance record');
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideAttendance = async () => {
    if (!selectedStudent || !overrideReason) {
      setError('Please select a student and provide a reason for override');
      return;
    }

    try {
      setLoading(true);
      await api.put('/superadmin/attendance/override', {
        attendanceId: selectedStudent.attendanceId,
        studentId: selectedStudent.studentId,
        status: selectedStudent.newStatus,
        reason: overrideReason
      });
      
      setSuccess('Attendance override successful!');
      setOverrideReason('');
      setSelectedStudent(null);
      fetchAttendanceRecord();
    } catch (error) {
      console.error('Error overriding attendance:', error);
      setError('Failed to override attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchAttendance = async () => {
    // Validate required filters
    if (!filters.university || !filters.campus || !filters.school || 
        !filters.program || !filters.course || !filters.batch || 
        !filters.section || !filters.subject || !filters.date) {
      alert('Please select all filters');
      return;
    }

    try {
      setLoading(true);
      const params = {
        batch: filters.batch,
        section: filters.section,
        subjectId: filters.subject,
        date: filters.date
      };
      const { data } = await api.get('/superadmin/attendance/record', { params });
      setAttendanceData(data);
    } catch (error) {
      console.error('Error searching attendance:', error);
      alert(`Failed to search attendance: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!selectedStudent || !overrideReason) {
      alert('Please select a student and provide an override reason');
      return;
    }

    try {
      setOverriding(true);
      await api.put('/superadmin/attendance/override', {
        subjectId: filters.subject,
        date: filters.date,
        slotNumber: attendanceData?.slotNumber ?? null,
        studentId: selectedStudent.student._id,
        newStatus: newStatus,
        remarks: remarks,
        overrideReason: overrideReason
      });

      alert('Attendance overridden successfully!');
      // Refresh the attendance data
      searchAttendance();
      // Reset form
      setSelectedStudent(null);
      setNewStatus('present');
      setRemarks('');
      setOverrideReason('');
    } catch (error) {
      console.error('Error overriding attendance:', error);
      alert(`Error overriding attendance: ${error.response?.data?.message || error.message}`);
    } finally {
      setOverriding(false);
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
      <h2 style={{ color: 'white', margin: 0, marginBottom: '1.5rem' }}>Super Admin Override</h2>
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: '1.5rem', marginBottom: '2rem' }}
      >
        <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Attendance Override</h3>
        
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
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Section *</label>
            <input
              type="text"
              name="section"
              value={filters.section}
              onChange={handleFilterChange}
              className="glass-input"
              placeholder="A"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          
          <div>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Subject *</label>
            <select
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              className="glass-input"
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Date *</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="glass-input"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={searchAttendance}
              disabled={loading}
              className="glass-button"
              style={{ 
                padding: '0.5rem 1rem', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                width: '100%',
                height: 'fit-content'
              }}
            >
              {loading ? 'Searching...' : 'Search Attendance'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {attendanceData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          {/* Attendance Summary */}
          <GlassCard className="p-6 lg:col-span-1">
            <h3 className="text-xl font-semibold text-white mb-4">Session Details</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Subject</p>
                <p className="text-white">{attendanceData.timetable?.subject?.name}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Date</p>
                <p className="text-white">{new Date(attendanceData.date).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Time Slot</p>
                <p className="text-white">{attendanceData.timeSlot}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Section</p>
                <p className="text-white">{attendanceData.timetable?.section}</p>
              </div>
              
              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Students</span>
                  <span className="text-white">{attendanceData.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Present</span>
                  <span className="text-green-400">{attendanceData.presentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">Absent</span>
                  <span className="text-red-400">{attendanceData.absentCount}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Attendance Records */}
          <GlassCard className="p-6 lg:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-4">Attendance Records</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-300">Student</th>
                    <th className="text-left py-2 px-3 text-gray-300">University ID</th>
                    <th className="text-left py-2 px-3 text-gray-300">Status</th>
                    <th className="text-left py-2 px-3 text-gray-300">Remarks</th>
                    <th className="text-left py-2 px-3 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.attendance.map((record, index) => (
                    <tr 
                      key={record.student._id} 
                      className={`border-b border-gray-800 hover:bg-gray-800/50 ${
                        selectedStudent?.student._id === record.student._id ? 'bg-blue-900/30' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-white">{record.student.name}</td>
                      <td className="py-2 px-3 text-gray-300">{record.student.universityId}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.attendance.status === 'present' 
                            ? 'bg-green-900/50 text-green-400' 
                            : 'bg-red-900/50 text-red-400'
                        }`}>
                          {record.attendance.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-300">{record.attendance.remarks || '-'}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => setSelectedStudent(record)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Override Form */}
          {selectedStudent && (
            <GlassCard className="p-6 lg:col-span-3">
              <h3 className="text-xl font-semibold text-white mb-4">
                Override Attendance for {selectedStudent.student.name}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Current Status</label>
                  <div className={`px-3 py-2 rounded-lg ${
                    selectedStudent.attendance.status === 'present' 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {selectedStudent.attendance.status}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">New Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Remarks (Optional)</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any remarks for this override"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Override Reason *</label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Mandatory reason for this override"
                    rows="3"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOverride}
                  disabled={overriding || !overrideReason}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {overriding ? 'Overriding...' : 'Confirm Override'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedStudent(null);
                    setNewStatus('present');
                    setRemarks('');
                    setOverrideReason('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminOverride;