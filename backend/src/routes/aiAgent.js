import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { chatWithRecruitmentAgent } from '../controllers/aiAgentController.js';

const router = express.Router();
router.post('/chat', authMiddleware, chatWithRecruitmentAgent);

export default router;
