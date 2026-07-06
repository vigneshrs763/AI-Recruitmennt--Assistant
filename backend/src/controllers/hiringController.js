import mongoose from 'mongoose';
import Candidate from '../models/Candidate.js';
import Activity from '../models/Activity.js';
import HindsightMemory from '../models/HindsightMemory.js';
import Job from '../models/Job.js';
import * as emailService from '../services/emailService.js';

// Hire candidate workflow
export const hireCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, offerDetails } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const candidate = await Candidate.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const recruiterInfo = {
      email: req.user.email,
      name: req.user.name || req.user.email
    };

    const job = candidate.jobId ? await Job.findById(candidate.jobId) : null;

    const emailResult = await emailService.sendOfferEmail(candidate, job, recruiterInfo);

    if (!emailResult?.success) {
      return res.status(500).json({
        message: 'Failed to send offer email',
        error: emailResult?.error || 'Unknown email error'
      });
    }

    // Update candidate status
    candidate.status = 'hired';
    candidate.decisionDate = new Date();
    candidate.decisionBy = req.user.email;
    candidate.decisionNotes = notes;
    candidate.offerDetails = offerDetails || {};
    await candidate.save();

    // Create activity log
    await Activity.create({
      type: 'offer_sent',
      candidateId: candidate._id,
      candidateName: candidate.name,
      jobId: candidate.jobId,
      userId: req.user._id,
      companyId: req.user._id,
      description: `Offer sent to ${candidate.name} for ${candidate.role}`,
      metadata: {
        score: candidate.score,
        decision: 'hire',
        reason: notes,
        recruiterEmail: req.user.email,
        timestamp: new Date()
      }
    });

    // Store in Hindsight memory
    await HindsightMemory.create({
      userId: req.user._id,
      companyId: req.user._id,
      type: 'hiring_preference',
      title: `Hired: ${candidate.name} (${candidate.role})`,
      description: `Successfully hired ${candidate.name}. Score: ${candidate.score}. Skills: ${candidate.skills.join(', ')}`,
      confidence: candidate.aiConfidence,
      preferredSkills: candidate.skills,
      preferredExperience: candidate.experience,
      preferredLocation: candidate.location,
      relatedCandidates: [candidate._id],
      relatedJobs: candidate.jobId ? [candidate.jobId] : [],
      successRate: 100,
      impact: 'high'
    });

    res.json({
      message: 'Offer email sent successfully.',
      candidate,
      activity: { type: 'offer_sent' }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send offer',
      error: error.message
    });
  }
};

// Reject candidate workflow
export const rejectCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const candidate = await Candidate.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const recruiterInfo = {
      email: req.user.email,
      name: req.user.name || req.user.email
    };

    const job = candidate.jobId ? await Job.findById(candidate.jobId) : null;

    const emailResult = await emailService.sendRejectionEmail(candidate, job, recruiterInfo);

    if (!emailResult?.success) {
      return res.status(500).json({
        message: 'Failed to send rejection email',
        error: emailResult?.error || 'Unknown email error'
      });
    }

    // Update candidate status
    candidate.status = 'rejected';
    candidate.decisionDate = new Date();
    candidate.decisionBy = req.user.email;
    candidate.rejectionReason = reason;
    candidate.decisionNotes = notes;
    await candidate.save();

    // Create activity log
    await Activity.create({
      type: 'rejection_sent',
      candidateId: candidate._id,
      candidateName: candidate.name,
      jobId: candidate.jobId,
      userId: req.user._id,
      companyId: req.user._id,
      description: `Rejection sent to ${candidate.name} for ${candidate.role}`,
      metadata: {
        score: candidate.score,
        decision: 'reject',
        reason: reason,
        recruiterEmail: req.user.email,
        timestamp: new Date()
      }
    });

    // Store rejection pattern in Hindsight memory
    await HindsightMemory.create({
      userId: req.user._id,
      companyId: req.user._id,
      type: 'decision_pattern',
      title: `Rejected: ${candidate.name}`,
      description: `Rejection reason: ${reason}. Score was ${candidate.score}.`,
      confidence: Math.max(0, 100 - candidate.aiConfidence),
      relatedCandidates: [candidate._id],
      impact: 'medium'
    });

    res.json({
      message: 'Rejection email sent successfully.',
      candidate,
      activity: { type: 'rejection_sent' }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to reject candidate',
      error: error.message
    });
  }
};

// Get activity log for a candidate
export const getCandidateActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const activities = await Activity.find({
      candidateId: id,
      userId: req.user._id
    }).sort({ createdAt: -1 });

    res.json({ activities });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
};

// Get hindsight memory for user
export const getHindsightMemory = async (req, res) => {
  try {
    const memory = await HindsightMemory.find({
      userId: req.user._id
    })
      .sort({ impact: -1, confidence: -1, createdAt: -1 })
      .limit(20);

    res.json({ memory });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch hindsight memory',
      error: error.message
    });
  }
};

// Mark candidate as hired (final confirmation)
export const confirmHire = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        status: 'hired',
        decisionDate: new Date()
      },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Log final hire
    await Activity.create({
      type: 'hired',
      candidateId: candidate._id,
      candidateName: candidate.name,
      jobId: candidate.jobId,
      userId: req.user._id,
      companyId: req.user._id,
      description: `${candidate.name} confirmed hired for ${candidate.role}`,
      metadata: {
        score: candidate.score,
        decision: 'hired_confirmed',
        recruiterEmail: req.user.email,
        timestamp: new Date()
      }
    });

    res.json({
      message: 'Candidate marked as hired',
      candidate
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to confirm hire',
      error: error.message
    });
  }
};
