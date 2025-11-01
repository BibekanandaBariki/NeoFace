import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import WebGLBackground from '../components/WebGLBackground';
import '../styles/glassmorphism.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = result.user?.role || user.role;
      
      if (role === 'superadmin') {
        navigate('/superadmin');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } else {
      setError(result.message || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <WebGLBackground>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: '450px' }}
        >
          <div className="glass-card">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 style={{
                color: 'white',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                NeoFace
              </h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                University Attendance System
              </p>
            </motion.div>

            <form onSubmit={handleSubmit}>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ marginBottom: '1.5rem' }}
              >
                <input
                  type="email"
                  className="glass-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ marginBottom: '1.5rem' }}
              >
                <input
                  type="password"
                  className="glass-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    color: '#ff6b6b',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontSize: '0.9rem'
                  }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                className="glass-button"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: '100%' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            >
              <p style={{ marginBottom: '0.75rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>Login Info:</p>
              <div>
                <p style={{ marginBottom: '0.25rem', fontWeight: '600' }}>Students:</p>
                <p style={{ marginLeft: '0.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
                  Email: Your registered email<br/>
                  Password: Your <strong>University ID</strong>
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.6)' }}>
                  (Password is the same as your University ID)
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </WebGLBackground>
  );
};

export default Login;

