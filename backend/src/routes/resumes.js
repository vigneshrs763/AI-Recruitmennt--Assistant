import express from 'express';
import { listResumes, uploadResume, getResume, deleteResume } from '../controllers/resumeController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, listResumes);
router.post('/upload', authMiddleware, uploadResume);
router.get('/:id', authMiddleware, getResume);
router.delete('/:id', authMiddleware, deleteResume);

export default router;
