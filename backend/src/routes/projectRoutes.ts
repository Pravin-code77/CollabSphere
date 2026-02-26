import { Router } from 'express';
import { createProject, getProjects, getProjectMatches, getMyProjects, requestToJoin, respondToJoinRequest, updateProject, deleteProject, getRecommendedProjects } from '../controllers/projectController';
import { getProjectMessages } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getProjects);
router.get('/recommended', authenticate, getRecommendedProjects);
router.get('/my', authenticate, getMyProjects);
router.post('/', authenticate, createProject);
router.get('/:projectId/match', authenticate, getProjectMatches);
router.get('/:projectId/messages', authenticate, getProjectMessages);
router.post('/:projectId/join', authenticate, requestToJoin);
router.put('/:projectId', authenticate, updateProject);
router.delete('/:projectId', authenticate, deleteProject);
router.post('/requests/:requestId/respond', authenticate, respondToJoinRequest);

export default router;
