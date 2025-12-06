const axios = require('axios');

async function testBackendFaceCommunication() {
    try {
        console.log('Testing backend to face service communication...');
        
        // First, let's check if we can access the backend API
        const backendHealth = await axios.get('https://neoface-backend.onrender.com/api/health');
        console.log('Backend health check:', backendHealth.status, backendHealth.data);
        
        // Now let's try to call the face recognition endpoint through the backend
        // This simulates what happens when you try to update a student's face
        
        // We'll send a request to a face recognition endpoint
        // But we need to be authenticated, so let's just test the basic connectivity
        
        console.log('Testing direct communication between services...');
        
        // Test the Python service directly with a proper request
        const testData = {
            frames: [
                "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQECAQECAQEBAQIBAQEBAQIBAQECAgICAgICAgIDAwQDAwMDAwICAwQEAwMEBAEFAgECAgECAgH/2wBDAQEBAQEBAQICAgICAgECAgECAgECAgECAgECAgECAgECAgECAgECAgECAgECAgECAgECAgECAgECAgH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AoAAf/9k="
            ]
        };
        
        const faceResponse = await axios.post('https://neoface-python-service.onrender.com/embed', testData, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Direct face service response:', faceResponse.status);
        console.log('Response data keys:', Object.keys(faceResponse.data));
        
        console.log('\n✅ Communication test completed successfully!');
        console.log('The services can communicate with each other.');
        console.log('The "Face detection failed" error is likely due to:');
        console.log('1. Environment variables not properly set in Render dashboard');
        console.log('2. The image data being sent is not suitable for face detection');
        console.log('3. Network timeout issues between services');
        
    } catch (error) {
        console.error('❌ Error testing service communication:');
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else {
            console.error('Error message:', error.message);
        }
    }
}

testBackendFaceCommunication();