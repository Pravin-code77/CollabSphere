import { Router } from 'express';
import { createProject, getProjects, getProjectMatches } from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getProjects);
router.post('/', authenticate, createProject);
router.get('/:projectId/match', authenticate, getProjectMatches);

export default router;
