import mongoose from 'mongoose';

const emailHistorySchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true
    },
    candidateName: {
      type: String,
      required: true
    },
    candidateEmail: {
      type: String,
      required: true
    },
    emailType: {
      type: String,
      enum: ['offer', 'rejection', 'interview', 'follow_up'],
      required: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    jobTitle: {
      type: String
    },
    subject: {
      type: String,
      required: true
    },
    recruiterEmail: {
      type: String
    },
    recruiterName: {
      type: String
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'bounced', 'opened', 'clicked'],
      default: 'sent'
    },
    messageId: {
      type: String
    },
    error: {
      type: String
    },
    openedAt: {
      type: Date
    },
    clickedAt: {
      type: Date
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      template: String
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

// Index for querying email history by candidate
emailHistorySchema.index({ candidateId: 1, timestamp: -1 });

// Index for querying all emails sent on a date
emailHistorySchema.index({ timestamp: -1 });

// Index for finding failed emails
emailHistorySchema.index({ status: 1, timestamp: -1 });

const EmailHistory = mongoose.model('EmailHistory', emailHistorySchema);

export default EmailHistory;
