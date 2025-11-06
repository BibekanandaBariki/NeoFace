/**
 * University System Setup Script
 * 
 * This script initializes the multi-campus university structure with:
 * - Campuses
 * - Programs  
 * - Branches
 * - Initial SuperAdmin for each campus
 * 
 * Run this ONCE during initial system setup
 */

const mongoose = require('mongoose');
const Campus = require('./models/Campus');
const Program = require('./models/Program');
const Branch = require('./models/Branch');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neoface_university';

// Campus Data
const campuses = [
  { code: 'PLK', name: 'Paralakhemundi Campus', city: 'Paralakhemundi', state: 'Odisha' },
  { code: 'BBS', name: 'Bhubaneswar Campus', city: 'Bhubaneswar', state: 'Odisha' },
  { code: 'BLG', name: 'Balangir Campus', city: 'Balangir', state: 'Odisha' },
  { code: 'RGD', name: 'Rayagada Campus', city: 'Rayagada', state: 'Odisha' },
  { code: 'BLS', name: 'Balasore Campus', city: 'Balasore', state: 'Odisha' },
  { code: 'CTP', name: 'Chatrapur Campus', city: 'Chatrapur', state: 'Odisha' }
];

// Program Data
const programs = [
  // Undergraduate
  { code: 'BTECH', name: 'Bachelor of Technology', shortName: 'B.Tech', level: 'undergraduate', years: 4, semesters: 8 },
  { code: 'BSC', name: 'Bachelor of Science', shortName: 'B.Sc', level: 'undergraduate', years: 3, semesters: 6 },
  { code: 'BBA', name: 'Bachelor of Business Administration', shortName: 'BBA', level: 'undergraduate', years: 3, semesters: 6 },
  { code: 'BCOM', name: 'Bachelor of Commerce', shortName: 'B.Com', level: 'undergraduate', years: 3, semesters: 6 },
  { code: 'BPHARM', name: 'Bachelor of Pharmacy', shortName: 'B.Pharm', level: 'undergraduate', years: 4, semesters: 8 },
  { code: 'BVSC', name: 'Bachelor of Veterinary Science & Animal Husbandry', shortName: 'B.V.Sc & A.H.', level: 'undergraduate', years: 5, semesters: 10 },
  // Postgraduate
  { code: 'MTECH', name: 'Master of Technology', shortName: 'M.Tech', level: 'postgraduate', years: 2, semesters: 4 },
  { code: 'MSC', name: 'Master of Science', shortName: 'M.Sc', level: 'postgraduate', years: 2, semesters: 4 },
  { code: 'MBA', name: 'Master of Business Administration', shortName: 'MBA', level: 'postgraduate', years: 2, semesters: 4 },
  // Diploma
  { code: 'DIP', name: 'Diploma', shortName: 'Diploma', level: 'diploma', years: 3, semesters: 6 },
  // PhD
  { code: 'PHD', name: 'Doctor of Philosophy', shortName: 'Ph.D', level: 'phd', years: 3, semesters: 6 }
];

// Branch Data (for different programs)
const btechBranches = [
  { code: 'CSE', name: 'Computer Science and Engineering', shortName: 'CSE', intake: 120 },
  { code: 'ECE', name: 'Electronics and Communication Engineering', shortName: 'ECE', intake: 60 },
  { code: 'EEE', name: 'Electrical and Electronics Engineering', shortName: 'EEE', intake: 60 },
  { code: 'CIVIL', name: 'Civil Engineering', shortName: 'Civil', intake: 60 },
  { code: 'MECH', name: 'Mechanical Engineering', shortName: 'Mech', intake: 60 },
  { code: 'MINING', name: 'Mining Engineering', shortName: 'Mining', intake: 30 },
  { code: 'AERO', name: 'Aerospace Engineering', shortName: 'Aero', intake: 30 },
  { code: 'AG', name: 'Agriculture Engineering', shortName: 'Agri', intake: 30 },
  { code: 'BT', name: 'Biotechnology', shortName: 'Biotech', intake: 30 },
  { code: 'DT', name: 'Dairy Technology', shortName: 'Dairy', intake: 30 }
];

const bscBranches = [
  { code: 'AGRI', name: 'Agriculture', shortName: 'Agriculture', intake: 60 },
  { code: 'ZOO', name: 'Zoology', shortName: 'Zoology', intake: 40 },
  { code: 'CHEM', name: 'Chemistry', shortName: 'Chemistry', intake: 40 },
  { code: 'BOT', name: 'Botany', shortName: 'Botany', intake: 40 },
  { code: 'PHY', name: 'Physics', shortName: 'Physics', intake: 40 },
  { code: 'NURS', name: 'Nursing', shortName: 'Nursing', intake: 30 },
  { code: 'FORN', name: 'Forensic Science', shortName: 'Forensic', intake: 30 },
  { code: 'MED', name: 'Medical Sciences', shortName: 'Medical', intake: 30 },
  { code: 'ANIM', name: 'Animation', shortName: 'Animation', intake: 30 }
];

async function setupUniversitySystem() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Create SuperAdmin if doesn't exist
    let superAdmin = await User.findOne({ email: 'superadmin@university.edu' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'System Administrator',
        email: 'superadmin@university.edu',
        password: 'Admin@123',  // Will be hashed automatically
        role: 'superadmin',
        universityId: 'SA001',
        isVerified: true,
        isActive: true
      });
      console.log('✅ SuperAdmin created');
    }

    // Create Campuses
    console.log('\n📍 Creating Campuses...');
    const createdCampuses = [];
    for (const campusData of campuses) {
      let campus = await Campus.findOne({ code: campusData.code });
      if (!campus) {
        campus = await Campus.create({
          ...campusData,
          location: {
            city: campusData.city,
            state: campusData.state
          },
          isActive: true,
          establishedYear: 2000,
          createdBy: superAdmin._id
        });
        console.log(`  ✓ ${campus.name} created`);
      } else {
        console.log(`  ⊙ ${campus.name} already exists`);
      }
      createdCampuses.push(campus);
    }

    // Create Programs
    console.log('\n📚 Creating Programs...');
    const createdPrograms = {};
    for (const programData of programs) {
      let program = await Program.findOne({ code: programData.code });
      if (!program) {
        program = await Program.create({
          ...programData,
          duration: {
            years: programData.years,
            semesters: programData.semesters
          },
          isActive: true,
          createdBy: superAdmin._id
        });
        console.log(`  ✓ ${program.name} created`);
      } else {
        console.log(`  ⊙ ${program.name} already exists`);
      }
      createdPrograms[program.code] = program;
    }

    // Create Branches for each campus
    console.log('\n🏢 Creating Branches...');
    const btechProgram = createdPrograms['BTECH'];
    const bscProgram = createdPrograms['BSC'];

    for (const campus of createdCampuses) {
      // Create B.Tech branches for this campus
      for (const branchData of btechBranches) {
        const branchCode = `${campus.code}_BTECH_${branchData.code}`;
        let branch = await Branch.findOne({ code: branchCode, campus: campus._id });
        
        if (!branch) {
          branch = await Branch.create({
            code: branchData.code,
            name: branchData.name,
            shortName: branchData.shortName,
            program: btechProgram._id,
            campus: campus._id,
            intake: branchData.intake,
            isActive: true,
            createdBy: superAdmin._id
          });
          console.log(`  ✓ ${campus.code} - B.Tech ${branchData.shortName} created`);
        }
      }

      // Create B.Sc branches for selected campuses
      if (['PLK', 'BBS'].includes(campus.code)) {
        for (const branchData of bscBranches) {
          const branchCode = `${campus.code}_BSC_${branchData.code}`;
          let branch = await Branch.findOne({ code: branchCode, campus: campus._id });
          
          if (!branch) {
            branch = await Branch.create({
              code: branchData.code,
              name: branchData.name,
              shortName: branchData.shortName,
              program: bscProgram._id,
              campus: campus._id,
              intake: branchData.intake,
              isActive: true,
              createdBy: superAdmin._id
            });
            console.log(`  ✓ ${campus.code} - B.Sc ${branchData.shortName} created`);
          }
        }
      }
    }

    console.log('\n✅ University System Setup Complete!');
    console.log('\n📊 Summary:');
    console.log(`   Campuses: ${createdCampuses.length}`);
    console.log(`   Programs: ${Object.keys(createdPrograms).length}`);
    console.log(`   Branches: Check database for count`);
    console.log('\n🔐 SuperAdmin Credentials:');
    console.log('   Email: superadmin@university.edu');
    console.log('   Password: Admin@123');
    console.log('\n⚠️  Please change the default password immediately!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup Error:', error);
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  setupUniversitySystem();
}

module.exports = setupUniversitySystem;
