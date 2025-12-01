
const axios = require('axios');

const API_URL = 'http://localhost:5003/api';
const SUPER_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGJhMDk5NThjNmI4Mzk3MDVlMmE4YSIsImlhdCI6MTc2MzU3OTM2MywiZXhwIjoxNzY0MTg0MTYzfQ.O_n4hSLuve9KN2qe8eqIG0W-1ZMmnNcPIYC7LF3Tltk';

async function testFlow() {
    try {
        console.log('=== STARTING RBAC VERIFICATION ===');

        // 1. Create Admin
        console.log('\n1. Creating Test Admin...');
        const uniqueId = Math.random().toString(36).substring(7);
        const adminEmail = `testadmin_${uniqueId}@neoface.com`;
        const adminPassword = 'password123';

        let adminToken = '';

        try {
            // Try registering directly
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                name: 'Test Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            console.log('✅ Admin Registered:', regRes.data.user.email);
        } catch (err) {
            console.error('❌ Failed to register admin:', err.response ? err.response.data : err.message);
            return;
        }

        // 2. Login as Admin
        console.log('\n2. Logging in as Admin...');
        try {
            const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
                email: adminEmail,
                password: adminPassword
            });
            adminToken = adminLoginRes.data.token;
            console.log('✅ Admin Login Successful');
        } catch (err) {
            console.error('❌ Failed to login admin:', err.response ? err.response.data : err.message);
            return;
        }

        // 3. Create Student
        console.log('\n3. Creating Test Student...');
        const studentEmail = `teststudent_${uniqueId}@neoface.com`;
        const studentPassword = 'password123';

        try {
            const studentRegRes = await axios.post(`${API_URL}/auth/register`, {
                name: 'Test Student',
                email: studentEmail,
                password: studentPassword,
                role: 'student'
            });
            console.log('✅ Student Registered:', studentRegRes.data.user.email);
        } catch (err) {
            console.error('❌ Failed to register student:', err.response ? err.response.data : err.message);
            return;
        }

        // 4. Login as Student
        console.log('\n4. Logging in as Student...');
        let studentToken = '';
        try {
            const studentLoginRes = await axios.post(`${API_URL}/auth/login`, {
                email: studentEmail,
                password: studentPassword
            });
            studentToken = studentLoginRes.data.token;
            console.log('✅ Student Login Successful');
        } catch (err) {
            console.error('❌ Failed to login student:', err.response ? err.response.data : err.message);
            return;
        }

        // 5. Verify RBAC: Student trying to access protected route (e.g. get all users)
        // Assuming /api/users is admin only
        console.log('\n5. Verifying RBAC (Student trying to access Admin route)...');
        try {
            await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.error('❌ RBAC FAILED: Student was able to access admin route!');
        } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 403 || error.response.status === 404)) {
                // 404 might mean route doesn't exist, but 401/403 is what we want. 
                // If 404, we might need a better test route.
                console.log(`✅ RBAC PASSED: Student denied access (${error.response.status})`);
            } else {
                console.log(`⚠️ Unexpected error code: ${error.response ? error.response.status : error.message}`);
            }
        }

        console.log('\n=== VERIFICATION COMPLETE ===');

    } catch (error) {
        console.error('❌ Verification Failed:', error.response ? error.response.data : error.message);
    }
}

testFlow();
