// Script to fix MongoDB indexes
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
    // Get the schools collection
    const schoolsCollection = db.collection('schools');
    
    // Drop the old index
    try {
      await schoolsCollection.dropIndex('code_1');
      console.log('✅ Dropped old code index');
    } catch (error) {
      console.log('ℹ️  Old code index not found or already dropped');
    }
    
    // Create the new compound index
    await schoolsCollection.createIndex({ code: 1, campus: 1 }, { unique: true });
    console.log('✅ Created new compound index on code and campus');
    
    // Create index on name and campus
    await schoolsCollection.createIndex({ name: 1, campus: 1 }, { unique: true });
    console.log('✅ Created new compound index on name and campus');
    
    console.log('🎉 Index fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
});