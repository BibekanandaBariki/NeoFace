# NeoFace - Multi-University Automated Attendance System

An advanced automated attendance system using face recognition technology for multi-university environments.

## Features

- **Multi-University Support**: Hierarchical structure supporting University → Campus → School → Program → Course → Branch → Batch → Section
- **Role-Based Access Control**: SuperAdmin, University Admin, Campus Admin, HOD, Teacher, and Student roles
- **Face Recognition Attendance**: Real-time attendance marking using facial recognition
- **Examination Management**: Eligibility checking, admit card generation, and exam monitoring
- **Advanced Analytics**: Attendance analytics with 3D visualizations and heatmap calendars
- **Real-time Updates**: WebSocket integration for live attendance updates
- **Mobile Responsive**: Fully responsive design for all devices

## Technology Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- Socket.IO for real-time communication
- Python Flask for face recognition service

### Frontend
- React.js with modern hooks
- Framer Motion for animations
- Chart.js for data visualization
- Tailwind CSS for styling

### Face Recognition Service
- Python with face_recognition library
- OpenCV for image processing
- Flask for API endpoints

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Python (v3.8 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NeoFace
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Install Python service dependencies:
```bash
cd ../python_service
pip install -r requirements.txt
```

## Configuration

1. Create a `.env` file in the backend directory with the following variables:
```env
MONGODB_URI=mongodb://localhost:27017/neoface
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

2. Update the frontend API configuration in `frontend/src/utils/api.js` if needed.

## Usage

1. Start MongoDB service

2. Start the backend server:
```bash
cd backend
npm start
```

3. Start the frontend development server:
```bash
cd frontend
npm start
```

4. Start the Python face recognition service:
```bash
cd python_service
python app.py
```

## Default SuperAdmin Credentials

- Email: bibekbariki786@gmail.com
- Password: Attitude321@11

## Project Structure

```
NeoFace/
├── backend/              # Node.js Express backend
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── controllers/      # Business logic
│   └── middleware/       # Authentication middleware
├── frontend/             # React.js frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── hooks/        # Custom hooks
│   └── public/           # Static assets
└── python_service/       # Python face recognition service
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request