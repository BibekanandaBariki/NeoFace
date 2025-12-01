// Script to fix MongoDB indexes for universities
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
    // Get the universities collection
    const universitiesCollection = db.collection('universities');
    
    // Drop the old indexes
    try {
      await universitiesCollection.dropIndex('code_1');
      console.log('✅ Dropped old code index');
    } catch (error) {
      console.log('ℹ️  Old code index not found or already dropped');
    }
    
    try {
      await universitiesCollection.dropIndex('name_1');
      console.log('✅ Dropped old name index');
    } catch (error) {
      console.log('ℹ️  Old name index not found or already dropped');
    }
    
    // Create the new partial indexes
    await universitiesCollection.createIndex({ code: 1 }, { unique: true, partialFilterExpression: { isActive: { $eq: true } } });
    console.log('✅ Created new partial index on code (isActive=true only)');
    
    await universitiesCollection.createIndex({ name: 1 }, { unique: true, partialFilterExpression: { isActive: { $eq: true } } });
    console.log('✅ Created new partial index on name (isActive=true only)');
    
    console.log('🎉 University index fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing university indexes:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
});