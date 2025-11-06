import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    campus: '',
    program: '',
    branch: '',
    batch: '',
    section: '',
    semester: '',
    credits: 3,
    type: 'core',
    faculty: [{ teacher: '', role: 'primary', assignedSections: [''] }],
    timetable: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '', section: '' }]
  });

  useEffect(() => {
    fetchSubjects();
    fetchCampuses();
    fetchPrograms();
    fetchBranches();
    fetchBatches();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
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

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/branches', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = editingSubject 
        ? `/api/subjects/${editingSubject._id}` 
        : '/api/subjects';
      
      const response = await fetch(url, {
        method: editingSubject ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setShowForm(false);
        setEditingSubject(null);
        setFormData({
          code: '',
          name: '',
          shortName: '',
          campus: '',
          program: '',
          branch: '',
          batch: '',
          section: '',
          semester: '',
          credits: 3,
          type: 'core',
          faculty: [{ teacher: '', role: 'primary', assignedSections: [''] }],
          timetable: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '', section: '' }]
        });
        fetchSubjects();
      } else {
        const error = await response.json();
        console.error('Error saving subject:', error);
        alert(`Error: ${error.message || 'Failed to save subject'}`);
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchSubjects();
      } else {
        const error = await response.json();
        console.error('Error deleting subject:', error);
        alert(`Error: ${error.message || 'Failed to delete subject'}`);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code || '',
      name: subject.name || '',
      shortName: subject.shortName || '',
      campus: subject.campus?._id || subject.campus || '',
      program: subject.program?._id || subject.program || '',
      branch: subject.branch?._id || subject.branch || '',
      batch: subject.batch?._id || subject.batch || '',
      section: subject.section || '',
      semester: subject.semester || '',
      credits: subject.credits || 3,
      type: subject.type || 'core',
      faculty: subject.faculty || [{ teacher: '', role: 'primary', assignedSections: [''] }],
      timetable: subject.timetable || [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '', section: '' }]
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

  const handleFacultyChange = (index, field, value) => {
    const updatedFaculty = [...formData.faculty];
    updatedFaculty[index][field] = value;
    setFormData(prev => ({
      ...prev,
      faculty: updatedFaculty
    }));
  };

  const handleTimetableChange = (index, field, value) => {
    const updatedTimetable = [...formData.timetable];
    updatedTimetable[index][field] = value;
    setFormData(prev => ({
      ...prev,
      timetable: updatedTimetable
    }));
  };

  // Filter data based on selections
  const filteredPrograms = programs.filter(program => 
    !formData.campus || program.campus?._id === formData.campus
  );

  const filteredBranches = branches.filter(branch => 
    (!formData.campus || branch.campus?._id === formData.campus) &&
    (!formData.program || branch.program?._id === formData.program)
  );

  const filteredBatches = batches.filter(batch => 
    (!formData.campus || batch.campus?._id === formData.campus) &&
    (!formData.program || batch.program?._id === formData.program) &&
    (!formData.branch || batch.branch?._id === formData.branch)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Subject Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingSubject(null);
            setFormData({
              code: '',
              name: '',
              shortName: '',
              campus: '',
              program: '',
              branch: '',
              batch: '',
              section: '',
              semester: '',
              credits: 3,
              type: 'core',
              faculty: [{ teacher: '', role: 'primary', assignedSections: [''] }],
              timetable: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '', section: '' }]
            });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Subject'}
        </motion.button>
      </div>

      {showForm && (
        <GlassCard className="mb-6 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Short Name</label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Campus *</label>
              <select
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Campus</option>
                {campuses.map(campus => (
                  <option key={campus._id} value={campus._id}>
                    {campus.name} ({campus.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Program *</label>
              <select
                name="program"
                value={formData.program}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.campus}
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Branch *</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.program}
              >
                <option value="">Select Branch</option>
                {filteredBranches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Batch *</label>
              <select
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.branch}
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="A, B, C, etc."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Semester *</label>
              <input
                type="number"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                min="1"
                max="12"
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Credits</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                min="1"
                max="6"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="core">Core</option>
                <option value="elective">Elective</option>
                <option value="theory">Theory</option>
                <option value="practical">Practical</option>
                <option value="project">Project</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Faculty</label>
              {formData.faculty.map((faculty, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Teacher ID"
                    value={faculty.teacher}
                    onChange={(e) => handleFacultyChange(index, 'teacher', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={faculty.role}
                    onChange={(e) => handleFacultyChange(index, 'role', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="guest">Guest</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Sections (comma separated)"
                    value={faculty.assignedSections.join(',')}
                    onChange={(e) => handleFacultyChange(index, 'assignedSections', e.target.value.split(','))}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Timetable</label>
              {formData.timetable.map((slot, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                  <select
                    value={slot.day}
                    onChange={(e) => handleTimetableChange(index, 'day', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimetableChange(index, 'startTime', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimetableChange(index, 'endTime', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Room"
                    value={slot.room}
                    onChange={(e) => handleTimetableChange(index, 'room', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Section"
                    value={slot.section}
                    onChange={(e) => handleTimetableChange(index, 'section', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingSubject ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Subjects</h3>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
        
        {!loading && subjects.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No subjects found. Add a new subject to get started.
          </div>
        )}
        
        {!loading && subjects.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Code</th>
                  <th className="text-left py-3 px-4 text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-gray-300">Branch</th>
                  <th className="text-left py-3 px-4 text-gray-300">Semester</th>
                  <th className="text-left py-3 px-4 text-gray-300">Credits</th>
                  <th className="text-left py-3 px-4 text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white">{subject.code}</td>
                    <td className="py-3 px-4 text-gray-300">{subject.name}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {subject.branch?.name} ({subject.branch?.code})
                    </td>
                    <td className="py-3 px-4 text-gray-300">{subject.semester}</td>
                    <td className="py-3 px-4 text-gray-300">{subject.credits}</td>
                    <td className="py-3 px-4 text-gray-300 capitalize">{subject.type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        subject.isActive 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {subject.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subject._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default SubjectManagement;