import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import UniversityAdminDashboard from './pages/UniversityAdminDashboard';
import CampusAdminDashboard from './pages/CampusAdminDashboard';
import './App.css';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/superadmin"
            element={
              <PrivateRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/university-admin"
            element={
              <PrivateRoute allowedRoles={['universityadmin']}>
                <UniversityAdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/campus-admin"
            element={
              <PrivateRoute allowedRoles={['campusadmin']}>
                <CampusAdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin', 'superadmin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/student"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;