import { Router } from 'express';
import { getDeterminantTask } from '../controllers/taskController';
import { solveTask, getLeaderboard } from '../controllers/scoreController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Route to get a generated 2x2 determinant task
router.get('/determinant', getDeterminantTask);

// Route to record task solution
router.post('/solve', authMiddleware, solveTask);

// Route to get the leaderboard
router.get('/leaderboard', optionalAuthMiddleware, getLeaderboard);

export default router;
