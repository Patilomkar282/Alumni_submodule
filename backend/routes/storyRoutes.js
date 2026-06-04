import express from 'express';
import multer from 'multer';
import { createStory, getStories, deleteStory, togglePinStory } from '../controllers/storyController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Public/Protected Routes
router.get('/', protect, getStories);

// Admin Routes
router.post('/', protect, admin, upload.single('image'), createStory);
router.delete('/:id', protect, admin, deleteStory);
router.put('/:id/pin', protect, admin, togglePinStory);

export default router;
