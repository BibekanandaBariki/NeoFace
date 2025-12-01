// Script to fix MongoDB indexes for courses
const mongoose = require('mongoose');
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

  try {
    // Get the courses collection
    const coursesCollection = db.collection('courses');
    
    // Drop the old index
    try {
      await coursesCollection.dropIndex('code_1');
      console.log('✅ Dropped old code index');
    } catch (error) {
      console.log('ℹ️  Old code index not found or already dropped');
    }
    
    // Create the new compound index
    await coursesCollection.createIndex({ code: 1, program: 1 }, { unique: true });
    console.log('✅ Created new compound index on code and program');
    
    // Create index on name and program
    await coursesCollection.createIndex({ name: 1, program: 1 }, { unique: true });
    console.log('✅ Created new compound index on name and program');
    
    console.log('🎉 Course index fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing course indexes:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
});