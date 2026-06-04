import SuccessStory from '../models/SuccessStory.js';
import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';

// Helper function to upload buffer to Cloudinary
const streamUpload = (req) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            { folder: 'success_stories' },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
};

// @desc    Create a new success story
// @route   POST /api/stories
// @access  Private/Admin
export const createStory = async (req, res) => {
    try {
        const { title, content, alumniId, isPinned } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Upload image to Cloudinary
        const result = await streamUpload(req);

        const story = await SuccessStory.create({
            title,
            content,
            alumniId: alumniId || null,
            imageUrl: result.secure_url,
            isPinned: isPinned === 'true' || isPinned === true,
            createdBy: req.user._id,
        });

        res.status(201).json(story);
    } catch (error) {
        console.error('Create Story Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all success stories
// @route   GET /api/stories
// @access  Public/Protected
export const getStories = async (req, res) => {
    try {
        // Sort pinned first, then by newest
        const stories = await SuccessStory.find()
            .populate('alumniId', 'name profilePhoto company graduationYear')
            .sort({ isPinned: -1, createdAt: -1 });
        res.json(stories);
    } catch (error) {
        console.error('Get Stories Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a success story
// @route   DELETE /api/stories/:id
// @access  Private/Admin
export const deleteStory = async (req, res) => {
    try {
        const story = await SuccessStory.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Delete from Cloudinary (optional but recommended)
        if (story.imageUrl) {
            const publicId = story.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`success_stories/${publicId}`);
        }

        await SuccessStory.deleteOne({ _id: req.params.id });
        res.json({ message: 'Story removed' });
    } catch (error) {
        console.error('Delete Story Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update pin status
// @route   PUT /api/stories/:id/pin
// @access  Private/Admin
export const togglePinStory = async (req, res) => {
    try {
        const story = await SuccessStory.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        story.isPinned = !story.isPinned;
        const updatedStory = await story.save();

        res.json(updatedStory);
    } catch (error) {
        console.error('Toggle Pin Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
