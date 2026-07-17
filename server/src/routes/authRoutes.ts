import { Router } from 'express';
import { register, login, getMe, updateProfile, listUsers, setUserAdmin } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);

// Admin-only user management
router.get('/users', authMiddleware, listUsers);
router.patch('/users/:id/admin', authMiddleware, setUserAdmin);

export default router;
