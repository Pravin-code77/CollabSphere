import { Router } from 'express';
import { register, login, updateMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/me', authenticate, updateMe);

export default router;

