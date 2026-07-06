import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { githubLogin, githubCallback, githubRepos, githubUser } from '../controllers/githubController.js';

const router = express.Router();

router.get('/login', githubLogin);
router.get('/callback', githubCallback);
router.get('/repos', authMiddleware, githubRepos);
router.get('/user', authMiddleware, githubUser);

export default router;
