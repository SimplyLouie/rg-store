import { Router } from 'express';
import { login, changePassword } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.put('/change-password', authMiddleware, changePassword);

export default router;
