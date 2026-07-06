import mongoose from 'mongoose';

const hindsightMemorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['hiring_preference', 'candidate_insight', 'job_pattern', 'decision_pattern'] },
    title: String,
    description: String,
    confidence: { type: Number, min: 0, max: 100, default: 70 },
    // Pattern data
    preferredSkills: [String],
    preferredExperience: String,
    preferredLocation: String,
    hiringPatterns: {
      averageHireRate: Number,
      commonRejectionReasons: [String],
      averageTimeToHire: Number,
      preferredRoles: [String]
    },
    // Event association
    relatedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
    relatedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    // Impact tracking
    successRate: { type: Number, min: 0, max: 100 },
    timesUsed: { type: Number, default: 0 },
    impact: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
  },
  { timestamps: true }
);

const HindsightMemory = mongoose.model('HindsightMemory', hindsightMemorySchema);

export default HindsightMemory;
