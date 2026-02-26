import express from 'express';
import { getNotifications, markAsRead, deleteNotification } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.post('/read', authenticate, markAsRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;
