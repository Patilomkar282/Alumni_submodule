import express from 'express';
import {
    registerUser, loginUser, getUserProfile, updateUserProfile,
    getUsersByRole, forgotPassword, verifyOTP, resetPassword, googleLogin,
    changePassword, deleteAccount, getMentorRecommendations,
    sendLoginOTP, verifyLoginOTP
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply strict rate limiter to all auth mutation endpoints
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/login-otp', authLimiter, sendLoginOTP);
router.post('/verify-login-otp', authLimiter, verifyLoginOTP);
router.post('/google', authLimiter, googleLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/reset-password', authLimiter, resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/users/recommendations', protect, getMentorRecommendations);
router.get('/users', protect, getUsersByRole);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

export default router;
