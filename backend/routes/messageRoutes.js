import express from 'express';
import { getMessages, sendMessage, markMessagesAsRead, toggleReaction } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);
router.put('/:userId/read', protect, markMessagesAsRead);
router.put('/:messageId/react', protect, toggleReaction);

export default router;
