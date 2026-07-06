import express from 'express';
import { listCandidates, getCandidate, createCandidate, updateCandidate, deleteCandidate } from '../controllers/candidateController.js';
import { updateCandidateStatus } from '../controllers/resumeController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, listCandidates);
router.post('/', authMiddleware, createCandidate);
router.get('/:id', authMiddleware, getCandidate);
router.patch('/:id', authMiddleware, updateCandidate);
router.patch('/:id/status', authMiddleware, updateCandidateStatus);
router.delete('/:id', authMiddleware, deleteCandidate);

export default router;
