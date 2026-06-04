import SavedPost from "../models/SavedPost.js";
import Post from "../models/Post.js";

// @desc    Save a post
// @route   POST /api/saved-posts
// @access  Private
export const savePost = async (req, res) => {
    try {
        const { postId } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if already saved
        const existingSavedPost = await SavedPost.findOne({
            user: req.user._id,
            post: postId
        });

        if (existingSavedPost) {
            return res.status(400).json({ message: "Post already saved" });
        }

        const savedPost = new SavedPost({
            user: req.user._id,
            post: postId
        });

        await savedPost.save();

        res.status(201).json({ message: "Post saved successfully", savedPost });
    } catch (error) {
        console.error("Error saving post:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Unsave a post
// @route   DELETE /api/saved-posts/:postId
// @access  Private
export const unsavePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const deletedSavedPost = await SavedPost.findOneAndDelete({
            user: req.user._id,
            post: postId
        });

        if (!deletedSavedPost) {
            return res.status(404).json({ message: "Saved post not found" });
        }

        res.status(200).json({ message: "Post unsaved successfully" });
    } catch (error) {
        console.error("Error unsaving post:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get all saved posts for current user
// @route   GET /api/saved-posts
// @access  Private
export const getSavedPosts = async (req, res) => {
    try {
        const savedPosts = await SavedPost.find({ user: req.user._id })
            .populate({
                path: "post",
                populate: {
                    path: "author",
                    select: "name profilePhoto role headline"
                }
            })
            .sort({ savedAt: -1 });

        // Filter out any null posts (in case original post was deleted)
        const validSavedPosts = savedPosts.filter(sp => sp.post !== null);

        res.status(200).json(validSavedPosts);
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Check if a post is saved
// @route   GET /api/saved-posts/check/:postId
// @access  Private
export const checkIsSaved = async (req, res) => {
    try {
        const { postId } = req.params;

        const savedPost = await SavedPost.findOne({
            user: req.user._id,
            post: postId
        });

        res.status(200).json({ isSaved: !!savedPost });
    } catch (error) {
        console.error("Error checking saved status:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
