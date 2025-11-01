import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import api from '../utils/api';

const WebcamCapture = ({ onComplete, isUpdate = false }) => {
  const webcamRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [frames, setFrames] = useState([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      return imageSrc;
    }
  }, [webcamRef]);

  const startCapture = async () => {
    setCapturing(true);
    setFrames([]);
    setMessage('Rotate your head slowly in a circular motion...');
    
    const capturedFrames = [];
    const totalFrames = 10;
    const interval = 500; // Capture every 500ms

    for (let i = 0; i < totalFrames; i++) {
      const frame = capture();
      if (frame) {
        capturedFrames.push(frame);
        setFrames(capturedFrames);
        setProgress(((i + 1) / totalFrames) * 100);
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    setMessage('Processing face registration...');

    try {
      if (isUpdate) {
        // For face update, just pass frames to callback without API call
        setMessage('Frames captured successfully!');
        setTimeout(() => {
          onComplete(capturedFrames);
        }, 1000);
      } else {
        // Normal registration flow
      const response = await api.post('/api/face/register', {
        imageData: capturedFrames[0],
        frames: capturedFrames
      });

      if (response.data.faceRegistered) {
        setMessage('Face registered successfully! Waiting for admin approval.');
        setTimeout(() => {
          onComplete();
        }, 2000);
        }
      }
    } catch (error) {
      if (isUpdate && capturedFrames.length > 0) {
        // For face update, still pass frames even on error (parent will handle API)
        setMessage('Frames captured. Processing...');
        setTimeout(() => {
          onComplete(capturedFrames);
        }, 500);
      } else {
      setMessage('Registration failed. Please try again.');
      console.error('Registration error:', error);
      }
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
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
        {capturing && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '1rem',
            borderRadius: '10px'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>Capturing: {frames.length}/10</div>
            <div style={{
              width: '200px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  transition: { duration: 0.3 }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            color: 'white',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}
        >
          {message}
        </motion.p>
      )}

      <button
        onClick={startCapture}
        disabled={capturing}
        className="glass-button"
        style={{ minWidth: '200px' }}
      >
        {capturing ? 'Capturing...' : 'Start Face Registration'}
      </button>
    </div>
  );
};

export default WebcamCapture;

