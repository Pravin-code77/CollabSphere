import { Router } from 'express';
import { getProfile, updateProfile, getGitHubSkills, deleteAccount, getDashboardData } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, getProfile);
router.get('/dashboard', authenticate, getDashboardData);
router.put('/me', authenticate, updateProfile);
router.post('/me/sync-github', authenticate, getGitHubSkills);
router.delete('/me', authenticate, deleteAccount);

export default router;
