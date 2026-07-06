import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ['resume_uploaded', 'candidate_reviewed', 'offer_sent', 'rejection_sent', 'hired', 'rejected'] },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    candidateName: String,
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: String,
    details: mongoose.Schema.Types.Mixed, // Flexible storage for event-specific data
    metadata: {
      score: Number,
      decision: String, // 'hire', 'reject', etc.
      reason: String,
      recruiterEmail: String,
      timestamp: Date
    }
  },
  { timestamps: true }
);

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
