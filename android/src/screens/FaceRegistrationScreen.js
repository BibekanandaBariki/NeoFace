import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Camera } from 'react-native-camera';
import api from '../utils/api';

const FaceRegistrationScreen = ({ navigation }) => {
  const cameraRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [frames, setFrames] = useState([]);
  const [progress, setProgress] = useState(0);

  const captureFrame = async () => {
    if (cameraRef.current && !capturing) {
      try {
        const options = { quality: 0.8, base64: true };
        const data = await cameraRef.current.takePictureAsync(options);
        return data.base64;
      } catch (error) {
        console.error('Capture error:', error);
        return null;
      }
    }
    return null;
  };

  const startRegistration = async () => {
    setCapturing(true);
    setFrames([]);
    setProgress(0);

    const capturedFrames = [];
    const totalFrames = 10;
    const interval = 500; // 500ms between frames

    try {
      for (let i = 0; i < totalFrames; i++) {
        const frame = await captureFrame();
        if (frame) {
          capturedFrames.push(`data:image/jpeg;base64,${frame}`);
          setFrames(capturedFrames);
          setProgress(((i + 1) / totalFrames) * 100);
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      // Send to backend
      const response = await api.post('/api/face/register', {
        imageData: capturedFrames[0],
        frames: capturedFrames
      });

      if (response.data.faceRegistered) {
        Alert.alert('Success', 'Face registered successfully! Waiting for admin approval.');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Face registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.constants.Type.front}
        captureAudio={false}
      >
        <View style={styles.overlay}>
          <Text style={styles.instructions}>
            Rotate your head slowly in a circular motion
          </Text>
          
          {capturing && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Capturing: {frames.length}/10
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, capturing && styles.buttonDisabled]}
            onPress={startRegistration}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Start Registration</Text>
            )}
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructions: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  button: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FaceRegistrationScreen;

