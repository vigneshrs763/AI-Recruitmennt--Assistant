import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: String },
    status: { type: String, default: 'uploaded' },
    score: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
