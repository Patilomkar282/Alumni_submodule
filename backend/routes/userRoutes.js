import express from 'express';
import { getProfile, getAlumni, getAnalytics, getAlumniById, getUserById, updateAvailability, reportUser, updateStatus, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Search users
router.get('/search', protect, searchUsers);

// Get User Profile
router.get('/profile', protect, getProfile);

// Get all alumni
router.get('/alumni', protect, getAlumni);

// Get User By ID
router.get('/:id', protect, getUserById);

// Get specific alumni
router.get('/alumni/:id', protect, getAlumniById);

// Update Availability Slots
router.put('/availability', protect, updateAvailability);

// Update Presence Status (Available/Busy/Offline)
router.put('/status', protect, updateStatus);

// Get Dashboard Analytics
router.get('/analytics/dashboard', protect, getAnalytics);

// Report User
router.post('/report', protect, reportUser);

export default router;
