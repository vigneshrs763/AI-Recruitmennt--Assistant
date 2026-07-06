import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('MONGODB_URI is not configured. Skipping MongoDB connection.');
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.warn(`MongoDB connection unavailable: ${error.message}`);
    return false;
  }
};

export default connectDB;
