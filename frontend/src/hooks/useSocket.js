import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = (userId, subjectId) => {
  const [socket, setSocket] = useState(null);
  const [attendanceUpdates, setAttendanceUpdates] = useState([]);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      
      if (subjectId) {
        socketInstance.emit('join-room', `subject-${subjectId}`);
      }
      
      if (userId) {
        socketInstance.emit('join-room', `user-${userId}`);
      }
    });

    socketInstance.on('attendance-updated', (data) => {
      console.log('Attendance updated:', data);
      setAttendanceUpdates((prev) => [...prev, data]);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId, subjectId]);

  return { socket, attendanceUpdates };
};

export default useSocket;

