import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const StudentDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const userData = JSON.parse(userStr);
      setUser(userData);

      const [subjectsRes, attendanceRes] = await Promise.all([
        api.get('/api/subjects'),
        api.get('/api/attendance'),
      ]);

      setSubjects(subjectsRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.name || 'Student'}</Text>
        <Text style={styles.subtitle}>Your Attendance Dashboard</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Subjects</Text>
        {subjects.map((subject) => (
          <View key={subject._id} style={styles.card}>
            <Text style={styles.cardTitle}>{subject.name}</Text>
            <Text style={styles.cardSubtitle}>{subject.code}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        {attendance.slice(0, 5).map((record) => (
          <View key={record._id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {record.subjectId?.name || 'Unknown'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {new Date(record.date).toLocaleDateString()} - {record.status}
            </Text>
          </View>
        ))}
      </View>

      {!user?.faceRegistered && (
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('FaceRegistration')}
        >
          <Text style={styles.registerButtonText}>Register Face</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  registerButton: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    padding: 15,
    margin: 15,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StudentDashboard;

