import { Router } from 'express';
import { generateExam, submitExam, getExamLeaderboardHandler } from '../controllers/examController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/exam/generate — build a randomized, time-budgeted exam plan
router.post('/generate', authMiddleware, generateExam);

// POST /api/exam/submit — persist the attempt and return the grade
router.post('/submit', authMiddleware, submitExam);

// GET /api/exam/leaderboard?module=lin_alg — best-30% average leaderboard
router.get('/leaderboard', optionalAuthMiddleware, getExamLeaderboardHandler);

export default router;
