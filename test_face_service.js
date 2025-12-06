const axios = require('axios');

async function testFaceService() {
    try {
        console.log('Testing face service connectivity...');
        
        // Test health endpoint
        const healthResponse = await axios.get('https://neoface-python-service.onrender.com/health');
        console.log('Health check:', healthResponse.status, healthResponse.data);
        
        // Test embed endpoint with a small test image
        const testFrames = [
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        ];
        
        console.log('Testing embed endpoint...');
        const embedResponse = await axios.post('https://neoface-python-service.onrender.com/embed', {
            frames: testFrames
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Embed response:', embedResponse.status, embedResponse.data);
        console.log('Success! Face service is working correctly.');
        
    } catch (error) {
        console.error('Error testing face service:');
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else {
            console.error('Error message:', error.message);
        }
    }
}

testFaceService();