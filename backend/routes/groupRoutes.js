import express from 'express';
import { createGroup, getMyGroups, inviteToGroup, acceptInvite, declineInvite, getGroupMessages } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createGroup);
router.get('/', protect, getMyGroups);
router.post('/:id/invite', protect, inviteToGroup);
router.put('/:id/join', protect, acceptInvite);
router.put('/:id/decline', protect, declineInvite);
router.get('/:id/messages', protect, getGroupMessages);

export default router;
