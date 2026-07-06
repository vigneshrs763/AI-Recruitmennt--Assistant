import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const REAL_EMAIL = process.env.EMAIL_USER;

if (!MONGODB_URI) {
  console.error("MongoDB URI not found in .env");
  process.exit(1);
}

if (!REAL_EMAIL) {
  console.error("EMAIL_USER not found in .env");
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
    
    // Find and update Sarah Chen, Michael Vance, Aisha Patel
    const targetNames = ["Sarah Chen", "Michael Vance", "Aisha Patel"];
    
    for (const name of targetNames) {
      const candidate = await Candidate.findOne({ name });
      if (candidate) {
        const oldEmail = candidate.email;
        candidate.email = REAL_EMAIL;
        // Also reset status to its default demo state so the user can test the 'Hire' flow from scratch
        if (name === "Sarah Chen") candidate.status = "strong_hire";
        if (name === "Michael Vance") candidate.status = "hire";
        if (name === "Aisha Patel") candidate.status = "consider";
        
        await candidate.save();
        console.log(`Updated ${name}: email changed from ${oldEmail} to ${REAL_EMAIL}, status reset to ${candidate.status}`);
      } else {
        console.log(`Candidate ${name} not found in database.`);
      }
    }
  } catch (error) {
    console.error("Error updating candidates in database:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
