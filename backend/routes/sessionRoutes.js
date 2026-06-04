import express from 'express';
import { bookSession, getMySessions, cancelSession, addFeedback, completeSession, registerForGlobalSession, getPublicGlobalSessions } from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/book', protect, bookSession);
router.get('/my-sessions', protect, getMySessions);
router.put('/:id/cancel', protect, cancelSession);
router.put('/:id/feedback', protect, addFeedback);
router.put('/:id/complete', protect, completeSession);
router.post('/:id/register', protect, registerForGlobalSession);
router.get('/global', protect, getPublicGlobalSessions);

export default router;
