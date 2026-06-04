import express from 'express';
import { sendRequest, getReceivedRequests, updateRequestStatus,getSentRequests,getConnections } from '../controllers/connectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request', protect, sendRequest);
router.get('/received', protect, getReceivedRequests);
router.get('/sent', protect, getSentRequests);
router.get('/', protect, getConnections);
router.put('/request/:id', protect, updateRequestStatus);

export default router;
