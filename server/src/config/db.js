import mongoose from 'mongoose';
import config from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.log('[MongoDB] Note: Please make sure MongoDB service is running or check MONGODB_URI in .env');
    // We do not exit process in dev to allow server to start even if DB is pending setup
    return null;
  }
};

