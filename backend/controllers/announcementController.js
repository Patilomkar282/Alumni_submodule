import Announcement from '../models/Announcement.js';

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public (or Private)
export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ date: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Private (Admin only - for now just Private)
export const createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;
        const announcement = await Announcement.create({ title, content });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
