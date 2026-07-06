import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MongoDB URI not found in .env");
  process.exit(1);
}

// Define the Candidate Schema
const candidateSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  status: String
}, { strict: false });

const Candidate = mongoose.model('Candidate', candidateSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");
    
    const candidates = await Candidate.find({});
    console.log(`Found ${candidates.length} candidates:`);
    candidates.forEach(c => {
      console.log(`- ID: ${c._id}, Name: ${c.name}, Email: ${c.email}, Role: ${c.role}, Status: ${c.status}`);
    });
  } catch (error) {
    console.error("Database connection/query error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
