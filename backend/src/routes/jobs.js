import express from 'express';
import { listJobs, createJob, getJob, updateJob, deleteJob } from '../controllers/jobController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, listJobs);
router.post('/', authMiddleware, createJob);
router.get('/:id', authMiddleware, getJob);
router.patch('/:id', authMiddleware, updateJob);
router.delete('/:id', authMiddleware, deleteJob);

export default router;
