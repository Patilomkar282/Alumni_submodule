import express from 'express';
import { getAllUsers, toggleSuspendUser, deleteUser, verifyAlumni, updateUserByAdmin, getUserStatsByAdmin, createGlobalSession, getAllSessionsByAdmin, broadcastGlobalSession, getAllReports, resolveReport, createAnnouncement, getAllAnnouncementsByAdmin, deleteAnnouncement, getPlatformAnalytics, getAccreditationReportData, bulkImportUsers } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User Management
router.post('/users/bulk-import', protect, admin, bulkImportUsers);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id', protect, admin, updateUserByAdmin);
router.get('/users/:id/stats', protect, admin, getUserStatsByAdmin);
router.put('/users/:id/suspend', protect, admin, toggleSuspendUser);
router.delete('/users/:id', protect, admin, deleteUser);
router.put('/users/:id/verify', protect, admin, verifyAlumni);

// Session Management
router.post('/sessions', protect, admin, createGlobalSession);
router.get('/sessions', protect, admin, getAllSessionsByAdmin);
router.post('/sessions/:id/broadcast', protect, admin, broadcastGlobalSession);

// Moderation & Reports
router.get('/reports', protect, admin, getAllReports);
router.put('/reports/:id', protect, admin, resolveReport);

// Analytics
router.get('/analytics', protect, admin, getPlatformAnalytics);

// Announcement Management
router.post('/announcements', protect, admin, createAnnouncement);
router.get('/announcements', protect, admin, getAllAnnouncementsByAdmin);
router.delete('/announcements/:id', protect, admin, deleteAnnouncement);

// Reports / Accreditation
router.get('/reports/accreditation', protect, admin, getAccreditationReportData);

export default router;
