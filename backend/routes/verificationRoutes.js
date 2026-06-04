import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    submitVerificationRequest,
    getMyVerificationStatus,
    getVerificationQueue,
    reviewVerification,
    getVerificationStats
} from '../controllers/verificationController.js';

const router = express.Router();

// Alumni routes
router.post('/submit', protect, submitVerificationRequest);
router.get('/status', protect, getMyVerificationStatus);

// Admin routes
router.get('/admin/queue', protect, admin, getVerificationQueue);
router.get('/admin/stats', protect, admin, getVerificationStats);
router.put('/admin/:id/review', protect, admin, reviewVerification);

export default router;
