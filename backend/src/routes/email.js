import express from 'express';
import * as emailController from '../controllers/emailController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All email routes require authentication
router.use(authMiddleware);

/**
 * Email Preview Routes
 */
// GET /api/email/preview/offer/:candidateId
router.get('/preview/offer/:candidateId', emailController.getOfferEmailPreview);

// GET /api/email/preview/rejection/:candidateId
router.get('/preview/rejection/:candidateId', emailController.getRejectionEmailPreview);

/**
 * Email Sending Routes
 */
// POST /api/email/send-offer/:candidateId
router.post('/send-offer/:candidateId', emailController.sendOfferEmail);

// POST /api/email/send-rejection/:candidateId
router.post('/send-rejection/:candidateId', emailController.sendRejectionEmail);

/**
 * Email History Routes
 */
// GET /api/email/history/:candidateId
router.get('/history/:candidateId', emailController.getEmailHistory);

/**
 * Statistics Routes
 */
// GET /api/email/stats
router.get('/stats', emailController.getEmailStats);

/**
 * Testing Route
 */
// GET /api/email/test?testEmail=your@email.com
router.get('/test', emailController.testEmail);

/**
 * Hiring with Email Routes
 */
// POST /api/email/hiring/:candidateId/hire
router.post('/hiring/:candidateId/hire', emailController.hireWithEmail);

// POST /api/email/hiring/:candidateId/reject
router.post('/hiring/:candidateId/reject', emailController.rejectWithEmail);

export default router;
