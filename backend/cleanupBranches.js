// Script to clean up duplicate branches
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Branch = require('./models/Branch');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neoface', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Find all branches
    const allBranches = await Branch.find({});
    console.log(`Found ${allBranches.length} branches`);
    
    // Group branches by their compound key
    const branchGroups = {};
    for (const branch of allBranches) {
      const key = `${branch.code}-${branch.course}-${branch.program}-${branch.campus}`;
      if (!branchGroups[key]) {
        branchGroups[key] = [];
      }
      branchGroups[key].push(branch);
    }
    
    // Find duplicates
    let duplicateCount = 0;
    for (const [key, branches] of Object.entries(branchGroups)) {
      if (branches.length > 1) {
        console.log(`Found ${branches.length} duplicates for key: ${key}`);
        duplicateCount += branches.length - 1;
        
        // Keep the first one, delete the rest
        for (let i = 1; i < branches.length; i++) {
          await Branch.findByIdAndDelete(branches[i]._id);
          console.log(`  Deleted duplicate branch: ${branches[i].name}`);
        }
      }
    }
    
    console.log(`\n✅ Cleaned up ${duplicateCount} duplicate branches`);
    
  } catch (error) {
    console.error('❌ Error cleaning up branches:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
});