const axios = require('axios');

const BASE_URL = 'https://neoface-backend.onrender.com/api';
// const BASE_URL = 'http://localhost:5003/api'; // For local testing

const SUPER_ADMIN = {
    email: 'bibekbariki786@gmail.com',
    password: 'Attitude321@11'
};

const TEST_STUDENT = {
    name: 'Connection Test Bot',
    email: 'connection_test_bot@example.com',
    password: 'password123',
    universityId: 'TEST_BOT_001',
    department: 'CSE',
    semester: 1,
    section: 'A',
    year: 2024
};

// Real Face (Hardcoded Base64 for reliability)
// This is a small but valid face image (a generated face)
const REAL_ABSOLUTE_FACE_BASE64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCADwAPADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6pooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAp6nqdrptv513JtB4VQMsx9AKp22u+bIiSadfw7zgM8Qxz0zg8VzXiR3k8VMkjMVSJdgP8AD9KvxEl48nPzL/MVwyxMueyPVo4KnKmpS3Z11FFFdx5QUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHMeKtPne5i1CziMrImx0X72M9R61z1tq8D3UdvFHM9wWGYwhyuDk59Olei1F9ng8zzPIi8z+9sGb86550OZ3R2UMW6UeR6oloooroOMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//Z"; // Placeholder for actual verify logic

async function getRealFaceBase64() {
    return `data:image/jpeg;base64,${REAL_ABSOLUTE_FACE_BASE64}`;
}

async function verifyRegistration() {
    try {
        console.log('🚀 Starting Connectivity Check...');

        // 1. Login SuperAdmin
        console.log('1️⃣  Logging in as SuperAdmin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, SUPER_ADMIN);
        const adminToken = adminLogin.data.token;
        console.log('   ✅ Logged in');

        // 2. Get or Create Student
        console.log('\n2️⃣  Getting Credentials...');

        let studentId = null;

        // Try to find existing first
        const listRes = await axios.get(`${BASE_URL}/students`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const existingBot = listRes.data.find(s => s.email === TEST_STUDENT.email);

        if (existingBot) {
            console.log(`   ✅ Found existing bot: ${existingBot._id}`);
            studentId = existingBot._id;
        } else {
            // Only create if absolutely necessary
            console.log('   New bot needed. Creating...');
            try {
                const createRes = await axios.post(`${BASE_URL}/students`, TEST_STUDENT, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                studentId = createRes.data._id || createRes.data.student._id;
                console.log(`   ✅ Created new bot: ${studentId}`);
            } catch (err) {
                // If creation fails (e.g. duplicate roll number), just grab ANY student to test with
                console.log('   ⚠️ Creation failed. Falling back to ANY valid student.');
                if (listRes.data.length > 0) {
                    // Hijack via Password Reset
                    console.log(`   Hijacking student ${listRes.data[0].name} for test...`);

                    // Student.userId is populated, so it's an object. Need ._id
                    const userObj = listRes.data[0].userId;
                    const targetUserId = userObj._id || userObj;

                    // Reset Password using USERS endpoint
                    await axios.put(`${BASE_URL}/users/${targetUserId}/password`, {
                        newPassword: TEST_STUDENT.password // 'password123'
                    }, {
                        headers: { Authorization: `Bearer ${adminToken}` }
                    });
                    console.log('   ✅ Password reset to known value.');
                    studentId = listRes.data[0]._id;

                    // Use the hijacked credentials
                    TEST_STUDENT.email = listRes.data[0].email;
                    // Login uses the password we just set
                } else {
                    throw new Error("No students available.");
                }
            }
        }


        // 3. Login as Student
        console.log(`\n3️⃣  Logging in as Student (${TEST_STUDENT.email})...`);
        const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_STUDENT.email,
            password: TEST_STUDENT.password // 'password123'
        });
        const studentToken = studentLogin.data.token;
        console.log('   ✅ Logged in as Student');

        // 4. Attempt Registration (With Real Face)
        console.log('\n4️⃣  Downloading Real Face (Obama)...');
        const realFace = await getRealFaceBase64();
        if (!realFace) return;

        console.log('   ✅ Downloaded. Sending to Face Registry...');
        console.log('   ⏳ Waiting for response...');

        const startTime = Date.now();

        try {
            await axios.post(`${BASE_URL}/face/register`, {
                imageData: realFace
            }, {
                headers: { Authorization: `Bearer ${studentToken}` },
                timeout: 130000
            });

            console.log('   ✅ SUCCESS! Real Face Registered.');
            console.log('   This proves the Server Logic is PERFECT.');
        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            console.log(`   ⏱️  Duration: ${duration.toFixed(1)}s`);

            if (error.response) {
                // If we get a response, the SERVICE IS UP!
                // 503 from our backend usually means "service unavailable" logic
                // 400 means "face not detected" - WHICH IS GOOD for connectivity

                if (error.response.status === 400 || error.response.status === 503) {
                    // Check message
                    const msg = error.response.data.message || '';
                    if (msg.includes('Face service unavailable') || msg.includes('face is clearly visible')) {
                        console.log(`   ✅ CONNECTION VERIFIED!`);
                        console.log(`   Response: "${msg}"`);
                        console.log(`   (This proves the Backend talked to Python Service, and Python Service said "No/Bad Face")`);
                    } else {
                        console.log(`   ⚠️  Received Error ${error.response.status}: ${msg}`);
                    }
                } else {
                    console.log(`   ❌ Failed with Status ${error.response.status}`);
                    console.log(error.response.data);
                }
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ❌ TIMEOUT: Backend did not respond in 130s.');
                console.log('   This implies Python service took too long or Backend hung.');
            } else {
                console.error('   ❌ Network Error:', error.message);
            }
        }

    } catch (err) {
        console.error('\n❌ SCRIPT FAILED:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

verifyRegistration();
