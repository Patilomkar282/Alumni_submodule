import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, updateNotificationAction } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.put('/:id/action', protect, updateNotificationAction);

export default router;
