import Candidate from '../models/Candidate.js';
import * as emailService from '../services/emailService.js';

export const getOfferEmailPreview = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    return res.json(emailService.getOfferEmailPreview(candidate, null));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to preview offer email', error: error.message });
  }
};

export const getRejectionEmailPreview = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    return res.json(emailService.getRejectionEmailPreview(candidate, null));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to preview rejection email', error: error.message });
  }
};

export const sendOfferEmail = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const result = await emailService.sendOfferEmail(candidate, null, { email: req.user?.email });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send offer email', error: error.message });
  }
};

export const sendRejectionEmail = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const result = await emailService.sendRejectionEmail(candidate, null, { email: req.user?.email });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send rejection email', error: error.message });
  }
};

export const getEmailHistory = async (req, res) => {
  try {
    const history = await emailService.getEmailHistory(req.params.candidateId);
    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch email history', error: error.message });
  }
};

export const getEmailStats = async (_req, res) => {
  return res.json({ message: 'Email stats not implemented yet' });
};

export const testEmail = async (req, res) => {
  try {
    const result = await emailService.sendTestEmail(req.query.testEmail);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
};

export const hireWithEmail = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const result = await emailService.sendOfferEmail(candidate, null, { email: req.user?.email });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process hiring email', error: error.message });
  }
};

export const rejectWithEmail = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const result = await emailService.sendRejectionEmail(candidate, null, { email: req.user?.email });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process rejection email', error: error.message });
  }
};
