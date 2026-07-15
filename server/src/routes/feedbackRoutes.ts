import { Router } from 'express';
import { createFeedback, getFeedbacks, deleteFeedback, createGitHubIssue } from '../controllers/feedbackController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/feedback - Public or authenticated feedback submission
router.post('/', optionalAuthMiddleware, createFeedback);

// GET /api/feedback - Fetch all feedbacks (Admin-only)
router.get('/', authMiddleware, getFeedbacks);

// DELETE /api/feedback/:id - Delete a feedback entry (Admin-only)
router.delete('/:id', authMiddleware, deleteFeedback);

// POST /api/feedback/:id/github-issue - Create a GitHub issue from feedback (Admin-only)
router.post('/:id/github-issue', authMiddleware, createGitHubIssue);

export default router;
