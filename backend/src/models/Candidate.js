import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    id: { type: Number, default: 0 },
    name: { type: String, required: true },
    email: { type: String, required: true },
    resumeUrl: { type: String },
    status: { type: String, default: 'new', enum: ['new', 'strong_hire', 'hire', 'consider', 'rejected', 'hired', 'offer_sent'] },
    score: { type: Number, default: 0 },
    role: { type: String, default: 'Software Engineer' },
    experience: { type: String, default: '2+ years' },
    location: { type: String, default: 'Remote' },
    skills: { type: [String], default: [] },
    missing: { type: [String], default: [] },
    education: { type: String, default: 'Relevant technical education' },
    summary: { type: String, default: 'Candidate analyzed by RecruitAI.' },
    aiConfidence: { type: Number, default: 70 },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Decision tracking
    decisionDate: { type: Date },
    decisionBy: { type: String }, // Email of recruiter who made decision
    decisionNotes: { type: String },
    rejectionReason: { type: String },
    offerDetails: {
      salary: String,
      startDate: String,
      position: String
    }
  },
  { timestamps: true }
);

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
