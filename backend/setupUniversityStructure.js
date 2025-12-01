// Script to set up the complete university structure based on the workflow document
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neoface', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  const setupUniversityStructure = async () => {
    try {
      const User = require('./models/User');
      const University = require('./models/University');
      const Campus = require('./models/Campus');
      const School = require('./models/School');
      const Program = require('./models/Program');
      const Course = require('./models/Course');
      const Branch = require('./models/Branch');
      const Batch = require('./models/Batch');
      const bcrypt = require('bcryptjs');
      
      const superAdminEmail = 'bibekbariki786@gmail.com';
      let superAdmin = await User.findOne({ email: superAdminEmail });
      
      if (!superAdmin) {
        // Use environment variable for SuperAdmin password, with fallback
        const defaultPassword = process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        superAdmin = await User.create({
          name: 'Bibekananda Bariki',
          email: superAdminEmail,
          password: hashedPassword,
          role: 'superadmin',
          isVerified: true,
          isActive: true
        });
        console.log('✅ SuperAdmin created');
      } else {
        console.log('✅ SuperAdmin already exists');
      }

      // Create University
      let university = await University.findOne({ code: 'NEOFACE_UNI' });
      if (!university) {
        university = await University.create({
          name: 'NeoFace University',
          code: 'NEOFACE_UNI',
          address: {
            street: 'University Avenue',
            city: 'Tech City',
            state: 'Tech State',
            country: 'India',
            pincode: '123456'
          },
          contactInfo: {
            phone: '+91 9876543210',
            email: 'info@neofaceuni.edu',
            website: 'https://www.neofaceuni.edu'
          },
          establishedYear: 2020,
          accreditation: 'NAAC A+',
          createdBy: superAdmin._id
        });
        console.log('✅ University created:', university.name);
      } else {
        console.log('✅ University already exists:', university.name);
      }

      // Create Campuses
      const campusesData = [
        {
          code: 'BBS',
          name: 'Bhubaneswar Campus',
          location: {
            address: 'Plot No. 123, Tech Park',
            city: 'Bhubaneswar',
            state: 'Odisha',
            pincode: '751024',
            coordinates: {
              latitude: 20.2961,
              longitude: 85.8245
            }
          },
          contactInfo: {
            phone: '+91 674 1234567',
            email: 'bbs@neofaceuni.edu',
            website: 'https://bbs.neofaceuni.edu'
          },
          establishedYear: 2020
        },
        {
          code: 'PLK',
          name: 'Paralakhemundi Campus',
          location: {
            address: 'NH-40, Paralakhemundi',
            city: 'Paralakhemundi',
            state: 'Odisha',
            pincode: '761200',
            coordinates: {
              latitude: 19.1284,
              longitude: 84.3973
            }
          },
          contactInfo: {
            phone: '+91 6823 123456',
            email: 'plk@neofaceuni.edu',
            website: 'https://plk.neofaceuni.edu'
          },
          establishedYear: 2021
        }
      ];

      const campuses = [];
      for (const campusData of campusesData) {
        let campus = await Campus.findOne({ code: campusData.code });
        if (!campus) {
          campus = await Campus.create({
            ...campusData,
            university: university._id,
            createdBy: superAdmin._id
          });
          console.log('✅ Campus created:', campus.name);
        } else {
          console.log('✅ Campus already exists:', campus.name);
        }
        campuses.push(campus);
      }

      // Create Schools for each campus
      const schoolsData = [
        {
          code: 'SOE',
          name: 'School of Engineering',
          fullName: 'School of Engineering',
          description: 'Engineering programs and research',
          establishedYear: 2020
        },
        {
          code: 'SOM',
          name: 'School of Management',
          fullName: 'School of Management',
          description: 'Management and business programs',
          establishedYear: 2021
        }
      ];

      const schools = [];
      for (const campus of campuses) {
        for (const schoolData of schoolsData) {
          // Check if school already exists for this campus
          let school = await School.findOne({ 
            code: schoolData.code, 
            campus: campus._id 
          });
          if (!school) {
            school = await School.create({
              ...schoolData,
              university: university._id,
              campus: campus._id,
              createdBy: superAdmin._id
            });
            console.log('✅ School created:', `${school.name} at ${campus.name}`);
          } else {
            console.log('✅ School already exists:', `${school.name} at ${campus.name}`);
          }
          schools.push(school);
        }
      }

      // Create Programs
      const programsData = [
        {
          code: 'BTECH',
          name: 'Bachelor of Technology',
          shortName: 'B.Tech',
          level: 'undergraduate',
          duration: {
            years: 4,
            semesters: 8
          },
          description: '4-year undergraduate engineering program',
          eligibilityCriteria: '10+2 with Physics, Chemistry, and Mathematics'
        },
        {
          code: 'MTECH',
          name: 'Master of Technology',
          shortName: 'M.Tech',
          level: 'postgraduate',
          duration: {
            years: 2,
            semesters: 4
          },
          description: '2-year postgraduate engineering program',
          eligibilityCriteria: 'B.Tech or equivalent degree'
        }
      ];

      const programs = [];
      for (const campus of campuses) {
        for (const school of schools.filter(s => s.campus.toString() === campus._id.toString())) {
          for (const programData of programsData) {
            let program = await Program.findOne({ 
              code: programData.code, 
              campus: campus._id,
              school: school._id
            });
            if (!program) {
              program = await Program.create({
                ...programData,
                university: university._id,
                campus: campus._id,
                school: school._id,
                createdBy: superAdmin._id
              });
              console.log('✅ Program created:', `${program.name} at ${campus.name} - ${school.name}`);
            } else {
              console.log('✅ Program already exists:', `${program.name} at ${campus.name} - ${school.name}`);
            }
            programs.push(program);
          }
        }
      }

      // Create Courses (Branches)
      const coursesData = [
        {
          code: 'CSE',
          name: 'Computer Science and Engineering',
          fullName: 'Computer Science and Engineering',
          description: 'Computer science and engineering discipline',
          credits: 160
        },
        {
          code: 'ECE',
          name: 'Electronics and Communication Engineering',
          fullName: 'Electronics and Communication Engineering',
          description: 'Electronics and communication engineering discipline',
          credits: 160
        }
      ];

      const courses = [];
      for (const program of programs) {
        const campus = campuses.find(c => c._id.toString() === program.campus.toString());
        const school = schools.find(s => s._id.toString() === program.school.toString());
        
        for (const courseData of coursesData) {
          let course = await Course.findOne({ 
            code: courseData.code, 
            program: program._id
          });
          if (!course) {
            course = await Course.create({
              ...courseData,
              program: program._id,
              university: university._id,
              campus: campus._id,
              school: school._id,
              createdBy: superAdmin._id
            });
            console.log('✅ Course created:', `${course.name} for ${program.name} at ${campus.name}`);
          } else {
            console.log('✅ Course already exists:', `${course.name} for ${program.name} at ${campus.name}`);
          }
          courses.push(course);
        }
      }

      // Create Branches
      const branchesData = [
        {
          code: 'CSE-A',
          name: 'Computer Science and Engineering - Section A',
          shortName: 'CSE-A',
          description: 'CSE Section A',
          intake: 60
        },
        {
          code: 'CSE-B',
          name: 'Computer Science and Engineering - Section B',
          shortName: 'CSE-B',
          description: 'CSE Section B',
          intake: 60
        }
      ];

      const branches = [];
      for (const course of courses) {
        const program = programs.find(p => p._id.toString() === course.program.toString());
        const campus = campuses.find(c => c._id.toString() === course.campus.toString());
        const school = schools.find(s => s._id.toString() === course.school.toString());
        
        for (const branchData of branchesData) {
          // Check if branch already exists with the correct compound key
          let branch = await Branch.findOne({ 
            code: branchData.code, 
            course: course._id,
            program: program._id,
            campus: campus._id
          });
          if (!branch) {
            branch = await Branch.create({
              ...branchData,
              course: course._id,
              program: program._id,
              university: university._id,
              campus: campus._id,
              school: school._id,
              createdBy: superAdmin._id
            });
            console.log('✅ Branch created:', `${branch.name} for ${course.name} at ${campus.name}`);
          } else {
            console.log('✅ Branch already exists:', `${branch.name} for ${course.name} at ${campus.name}`);
          }
          branches.push(branch);
        }
      }

      // Create Batches
      const batchesData = [
        {
          admissionYear: 2024,
          passOutYear: 2028,
          numberOfSections: 2
        },
        {
          admissionYear: 2023,
          passOutYear: 2027,
          numberOfSections: 2
        }
      ];

      const batches = [];
      for (const branch of branches) {
        const course = courses.find(c => c._id.toString() === branch.course.toString());
        const program = programs.find(p => p._id.toString() === branch.program.toString());
        const campus = campuses.find(c => c._id.toString() === branch.campus.toString());
        const school = schools.find(s => s._id.toString() === branch.school.toString());
        
        for (const batchData of batchesData) {
          const year = `${batchData.admissionYear}-${batchData.passOutYear}`;
          let batch = await Batch.findOne({ 
            year: year, 
            branch: branch._id
          });
          if (!batch) {
            // Generate sections array
            const sections = Array.from({ length: batchData.numberOfSections }, (_, i) => 
              String.fromCharCode(65 + i) // 'A', 'B', 'C', etc.
            );
            
            batch = await Batch.create({
              year: year,
              admissionYear: batchData.admissionYear,
              passOutYear: batchData.passOutYear,
              course: course._id,
              program: program._id,
              branch: branch._id,
              university: university._id,
              campus: campus._id,
              school: school._id,
              numberOfSections: sections.length,
              sections: sections,
              totalStudents: 0,
              currentSemester: 1,
              createdBy: superAdmin._id
            });
            console.log('✅ Batch created:', `${batch.year} for ${branch.name} at ${campus.name}`);
          } else {
            console.log('✅ Batch already exists:', `${batch.year} for ${branch.name} at ${campus.name}`);
          }
          batches.push(batch);
        }
      }

      console.log('\n🎉 University structure setup completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`  - University: 1`);
      console.log(`  - Campuses: ${campuses.length}`);
      console.log(`  - Schools: ${schools.length}`);
      console.log(`  - Programs: ${programs.length}`);
      console.log(`  - Courses: ${courses.length}`);
      console.log(`  - Branches: ${branches.length}`);
      console.log(`  - Batches: ${batches.length}`);
      
    } catch (error) {
      console.error('❌ Error setting up university structure:', error);
    } finally {
      mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
  };

  setupUniversityStructure();

});
