// Script to clean up incomplete branches (missing course references)
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
    // Find branches with missing course references
    const incompleteBranches = await Branch.find({ course: { $exists: false } });
    console.log(`Found ${incompleteBranches.length} incomplete branches`);
    
    // Delete incomplete branches
    for (const branch of incompleteBranches) {
      await Branch.findByIdAndDelete(branch._id);
      console.log(`  Deleted incomplete branch: ${branch.code} - ${branch.name}`);
    }
    
    console.log(`\n✅ Cleaned up ${incompleteBranches.length} incomplete branches`);
    
  } catch (error) {
    console.error('❌ Error cleaning up incomplete branches:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
});