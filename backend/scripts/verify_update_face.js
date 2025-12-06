const axios = require('axios');

const BASE_URL = 'https://neoface-backend.onrender.com/api';

const SUPER_ADMIN = {
    email: 'bibekbariki786@gmail.com',
    password: 'Attitude321@11'
};

const TEST_STUDENT = {
    name: 'Update Test Bot',
    email: `update_bot_${Date.now()}@example.com`,
    universityId: `UPD_${Date.now()}`,
    department: 'CSE',
    semester: 1,
    year: 2024
};

// 1x1 Pixel (Tiny)
// const DUMMY_IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDAREAAhEBAxEB/8HAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q==";

// use a slightly larger buffer to simulate real payload if needed, 
// but even 5 tiny images checks the ROUTE logic.
const DUMMY_IMAGE = "data:image/jpeg;base64," + "A".repeat(100000); // ~100KB image

async function verifyUpdate() {
    try {
        console.log('🚀 Starting Update Face Check...');

        // 1. Login SuperAdmin
        console.log('1️⃣  Logging in as SuperAdmin...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, SUPER_ADMIN);
        const token = loginRes.data.token;
        console.log('   ✅ Logged in');

        // 2. Create Student
        let studentId;
        try {
            const studentRes = await axios.post(`${BASE_URL}/students`, TEST_STUDENT, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const student = studentRes.data.student || studentRes.data;
            studentId = student._id;
            console.log(`   ✅ Student Created: ${studentId}`);
        } catch (e) {
            console.log('   ℹ️  Could not create new student (likely duplicate), fetching existing...');
            const listRes = await axios.get(`${BASE_URL}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (listRes.data && listRes.data.length > 0) {
                studentId = listRes.data[0]._id;
                console.log(`   ✅ Using Existing Student: ${studentId}`);
            } else {
                throw new Error("No students found to test with!");
            }
        }

        // 3. Update Face (5 Frames)
        console.log('\n3️⃣  Sending 5 Frames to Update Endpoint...');
        const payload = {
            imageData: DUMMY_IMAGE,
            frames: [DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE]
        };

        console.log(`   📦 Payload Size: ~${(payload.frames.length * 100) / 1024} KB`);
        console.log('   ⏳ Waiting for response...');

        const startTime = Date.now();

        try {
            await axios.put(`${BASE_URL}/face/update/${studentId}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });
            console.log('   ✅ SUCCESS! Updated face data (Backend accepted 5 frames)');
        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            console.log(`   ⏱️  Duration: ${duration.toFixed(1)}s`);

            if (error.response) {
                console.log(`   ❌ Failed with Status ${error.response.status}`);
                console.log(`   Message: ${JSON.stringify(error.response.data)}`);

                if (error.response.status === 413) {
                    console.log("   👉 CAUSE: Payload Too Large (413). Need to increase limit.");
                } else if (error.response.status === 504 || error.response.status === 502) {
                    console.log("   👉 CAUSE: Gateway Timeout (504/502). Render/Nginx killed it.");
                } else if (error.response.status === 400) {
                    console.log("   👉 CAUSE: Bad Request (Likely 'Face detection failed' which is OK/Expected for dummy images)");
                }
            } else {
                console.log('   ❌ Network Error:', error.message);
            }
        }

    } catch (err) {
        console.error('SCRIPT ERROR:', err.message);
        if (err.response) console.log(err.response.data);
    }
}

verifyUpdate();
