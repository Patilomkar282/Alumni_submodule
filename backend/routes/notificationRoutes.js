import express from 'express';
import { getNotifications, markAsRead, updateNotificationAction } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/:id/action', protect, updateNotificationAction);

export default router;
