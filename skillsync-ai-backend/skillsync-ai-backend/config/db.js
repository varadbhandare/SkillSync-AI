const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillsync_ai';
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn(`[MongoDB Warning]: Ensure MongoDB server is running on localhost:27017 or check MONGO_URI in .env`);
    // Do not crash server in development so API can still provide mock/in-memory fallbacks if needed
  }
};

module.exports = connectDB;
