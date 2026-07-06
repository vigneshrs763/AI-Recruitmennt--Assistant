import express from 'express';
import {
  hireCandidate,
  rejectCandidate,
  getCandidateActivity,
  getHindsightMemory,
  confirmHire
} from '../controllers/hiringController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Hindsight memory
router.get('/memory/all', authMiddleware, getHindsightMemory);

// Hiring decisions
router.post('/:id/hire', authMiddleware, hireCandidate);
router.post('/:id/reject', authMiddleware, rejectCandidate);
router.post('/:id/confirm', authMiddleware, confirmHire);

// Activity tracking
router.get('/:id/activity', authMiddleware, getCandidateActivity);

export default router;
