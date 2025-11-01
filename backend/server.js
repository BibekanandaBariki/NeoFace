const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/face', require('./routes/face'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'NeoFace API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      subjects: '/api/subjects',
      attendance: '/api/attendance',
      analytics: '/api/analytics',
      face: '/api/face'
    }
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'NeoFace API Server',
    version: '1.0.0',
    status: 'running',
    description: 'Face Recognition Attendance System API',
    baseUrl: '/api',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me'
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
        changePassword: 'PUT /api/users/:id/password'
      },
      students: {
        list: 'GET /api/students',
        create: 'POST /api/students',
        get: 'GET /api/students/:id',
        update: 'PUT /api/students/:id',
        delete: 'DELETE /api/students/:id',
        updateFace: 'PUT /api/students/:id/face'
      },
      subjects: {
        list: 'GET /api/subjects',
        create: 'POST /api/subjects',
        update: 'PUT /api/subjects/:id',
        delete: 'DELETE /api/subjects/:id'
      },
      attendance: {
        mark: 'POST /api/attendance',
        manual: 'POST /api/attendance/manual',
        get: 'GET /api/attendance'
      },
      analytics: 'GET /api/analytics',
      face: {
        register: 'POST /api/face/register',
        recognize: 'POST /api/face/recognize',
        approve: 'POST /api/face/approve/:studentId',
        reject: 'POST /api/face/reject/:studentId',
        update: 'PUT /api/face/update/:studentId'
      }
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Initialize SuperAdmin helper
const initSuperAdmin = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const superAdminEmail = 'bibekbariki786@gmail.com';
    
    const superAdminExists = await User.findOne({ email: superAdminEmail }).maxTimeMS(5000);
    
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash('Attitude321@11', 10);
      await User.create({
        name: 'Bibekananda Bariki',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'superadmin',
        isVerified: true,
        isActive: true
      });
      console.log('✅ SuperAdmin initialized');
    } else {
      console.log('✅ SuperAdmin already exists');
    }
  } catch (err) {
    console.log('⚠️  SuperAdmin init error:', err.message);
  }
};

// MongoDB Connection with event-based SuperAdmin init
const connectDB = async () => {
  mongoose.set('bufferCommands', false);
  
  mongoose.connection.once('connected', async () => {
    console.log('✅ MongoDB Connected');
    setTimeout(() => initSuperAdmin(), 2000);
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Error:', err.message);
  });
  
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neoface';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    return true;
  } catch (err) {
    console.error('⚠️  MongoDB connection failed, server will continue:', err.message);
    return false;
  }
};

// Server start
const PORT = process.env.PORT || 5001;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API Endpoints available at: http://localhost:${PORT}/api`);
  await connectDB();
});

module.exports = { app, io };
