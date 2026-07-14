import { Router } from 'express';
import { getDeterminantTask } from '../controllers/taskController';

const router = Router();

// Route to get a generated 2x2 determinant task
router.get('/determinant', getDeterminantTask);

export default router;
