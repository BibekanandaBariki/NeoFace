import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import api from '../utils/api';

const FaceRecognitionCapture = ({ subjectId, onAttendanceMarked }) => {
  const webcamRef = useRef(null);
  const [recognizing, setRecognizing] = useState(false);
  const [message, setMessage] = useState('');
  const [recognizedStudents, setRecognizedStudents] = useState([]);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      return webcamRef.current.getScreenshot();
    }
    return null;
  }, [webcamRef]);

  const recognizeFace = async () => {
    setRecognizing(true);
    setMessage('Capturing image...');

    try {
      const imageData = capture();
      if (!imageData) {
        setMessage('Failed to capture image');
        return;
      }

      setMessage('Recognizing face...');
      const response = await api.post('/api/face/recognize', {
        imageData,
        subjectId,
        location: null // Can add GPS location here
      });

      if (response.data.message && response.data.message.includes('successfully')) {
        // Success - attendance marked
        const recognized = response.data.recognized || response.data;
        const confidence = response.data.confidence || recognized.confidence || 0;
        setMessage(`✅ Attendance marked for ${recognized.name || 'student'}! (Confidence: ${(confidence * 100).toFixed(1)}%)`);
        
        // Add to recognized list
        setRecognizedStudents(prev => {
          if (!prev.find(s => s.universityId === recognized.universityId)) {
            return [...prev, { ...recognized, confidence }];
          }
          return prev;
        });

        if (onAttendanceMarked) {
          onAttendanceMarked(response.data.attendance || response.data);
        }
        
        setTimeout(() => {
          setMessage('');
        }, 5000);
      } else if (response.data.message && response.data.message.includes('already marked')) {
        // Already marked today
        setMessage(`ℹ️ Attendance already marked for today.`);
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setMessage('Face not recognized. Please try again.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Recognition failed');
      console.error('Recognition error:', error);
    } finally {
      setRecognizing(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          margin: '0 auto',
          borderRadius: '15px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{ width: '100%', height: 'auto' }}
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: 'user'
            }}
          />
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: message.includes('marked') 
                ? 'rgba(74, 222, 128, 0.2)'
                : 'rgba(248, 113, 113, 0.2)',
              borderRadius: '10px',
              color: 'white'
            }}
          >
            {message}
          </motion.div>
        )}

        <button
          onClick={recognizeFace}
          disabled={recognizing || !subjectId}
          className="glass-button"
          style={{ minWidth: '200px' }}
        >
          {recognizing ? 'Recognizing...' : 'Mark Attendance'}
        </button>
      </div>

      {recognizedStudents.length > 0 && (
        <div style={{
          flex: '0 0 250px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '1.5rem',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>Present</h3>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recognizedStudents.map((student, index) => (
              <motion.li 
                key={student.universityId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ padding: '0.5rem 0', color: '#a5b4fc', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                {student.name}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      )}
    </div>
  );
};

export default FaceRecognitionCapture;

