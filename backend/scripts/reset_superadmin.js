const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (Simplified version of what's in models/User.js)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin', 'superadmin', 'campusadmin', 'hod'], default: 'student' },
    universityId: { type: String },
    department: { type: String },
    section: { type: String },
    semester: { type: String },
    faceEmbedding: { type: Array, default: [] }, // Store 128-d vector
    isVerified: { type: Boolean, default: false }, // Email verification
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    profileImage: { type: String }, // URL or Base64
    faceRegistered: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

const resetSuperAdmin = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('❌ MONGODB_URI environment variable is not set');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        const email = 'bibekbariki786@gmail.com';
        const newPassword = 'Attitude321@11';

        const user = await User.findOne({ email });

        if (!user) {
            console.log('⚠️ SuperAdmin not found. Creating new user...');
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.create({
                name: 'Bibekananda Bariki',
                email: email,
                password: hashedPassword,
                role: 'superadmin',
                isVerified: true,
                isActive: true
            });
            console.log(`✅ SuperAdmin created with password: ${newPassword}`);
        } else {
            console.log('ℹ️ SuperAdmin found. Updating password...');
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.isActive = true;            // Ensure active
            user.isDeleted = false;          // Ensure not deleted
            user.role = 'superadmin';        // Ensure role
            await user.save();
            console.log(`✅ SuperAdmin password updated to: ${newPassword}`);
        }

        await mongoose.disconnect();
        console.log('👋 Disconnected');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error resetting password:', error);
        process.exit(1);
    }
};

resetSuperAdmin();
