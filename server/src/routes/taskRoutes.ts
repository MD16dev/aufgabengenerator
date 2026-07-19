import { Router } from 'express';
import { getTask } from '../controllers/taskController';
import { solveTask, getLeaderboard, getEloLeaderboard } from '../controllers/scoreController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Specific routes must be registered BEFORE the generic /:type catch-all,
// otherwise /:type would intercept /leaderboard and /solve.
router.post('/solve', authMiddleware, solveTask);
router.get('/leaderboard', optionalAuthMiddleware, getLeaderboard);
router.get('/elo-leaderboard', optionalAuthMiddleware, getEloLeaderboard);

// Generic task route: /api/tasks/:type resolves the generator via the registry
router.get('/:type', getTask);

export default router;
