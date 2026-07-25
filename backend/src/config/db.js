const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️  MONGODB_URI not found in env. Falling back to JSON file storage (local development).');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected successfully.');
    return true;
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    console.log('⚠️  Falling back to JSON file storage (local development).');
    return false;
  }
};

module.exports = connectDB;
