import Post from "../models/Post.js";
import User from "../models/User.js";

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
    try {
        const { content, image, postType, title, eventDate, eventLocation } = req.body;

        const newPost = new Post({
            author: req.user._id,
            content,
            image,
            postType: postType || 'post',
            title,
            eventDate,
            eventLocation
        });

        const savedPost = await newPost.save();

        // Populate author details for the response
        await savedPost.populate("author", "name profilePhoto role headline");

        res.status(201).json(savedPost);
    } catch (err) {
        console.error("Error creating post:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
export const getAllPosts = async (req, res) => {
    try {
        const cursor = req.query.cursor;
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type;

        let query = {};
        if (cursor) {
            query._id = { $lt: cursor };
        }
        if (type && type !== 'all') {
            query.postType = type;
        }

        // Fetch limit + 1 posts to determine if there's a next page
        const posts = await Post.find(query)
            .populate("author", "name profilePhoto role headline") // Populate author info
            .populate("comments.user", "name profilePhoto") // Populate comment authors
            .populate({
                path: "repostedFrom",
                populate: { path: "author", select: "name profilePhoto role" }
            })
            .sort({ _id: -1 }) // Newest first via _id which includes timestamp
            .limit(limit + 1);

        const hasNextPage = posts.length > limit;
        const returnedPosts = hasNextPage ? posts.slice(0, limit) : posts;
        const nextCursor = returnedPosts.length > 0 ? returnedPosts[returnedPosts.length - 1]._id : null;

        res.status(200).json({
            posts: returnedPosts,
            nextCursor,
            hasNextPage
        });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Like or Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the post has already been liked by this user
        if (post.likes.includes(req.user._id)) {
            // Unlike
            post.likes = post.likes.filter(
                (like) => like.toString() !== req.user._id.toString()
            );
        } else {
            // Like
            post.likes.push(req.user._id);
        }

        await post.save();
        res.status(200).json(post.likes);
    } catch (err) {
        console.error("Error liking post:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const newComment = {
            user: req.user._id,
            text,
        };

        post.comments.push(newComment);
        await post.save();

        // Re-fetch to populate the new comment's user
        const updatedPost = await Post.findById(req.params.id)
            .populate("comments.user", "name profilePhoto");

        res.status(200).json(updatedPost.comments);
    } catch (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Reply to a comment
// @route   POST /api/posts/:postId/comments/:commentId/reply
// @access  Private
export const replyToComment = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const newReply = {
            user: req.user._id,
            text,
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await post.save();

        const updatedPost = await Post.findById(req.params.postId)
            .populate("comments.user", "name profilePhoto")
            .populate("comments.replies.user", "name profilePhoto");

        res.status(200).json(updatedPost.comments);
    } catch (err) {
        console.error("Error replying to comment:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check user
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        comment.deleteOne();
        await post.save();

        res.status(200).json(post.comments);
    } catch (err) {
        console.error("Error deleting comment:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Edit a comment
// @route   PUT /api/posts/:postId/comments/:commentId
// @access  Private
export const editComment = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check user
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        comment.text = text;
        await post.save();

        res.status(200).json(post.comments);
    } catch (err) {
        console.error("Error editing comment:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Repost a post
// @route   POST /api/posts/:id/repost
// @access  Private
export const repostPost = async (req, res) => {
    try {
        const originalPost = await Post.findById(req.params.id);
        if (!originalPost) {
            return res.status(404).json({ message: "Original post not found" });
        }

        const newPost = new Post({
            author: req.user._id,
            content: originalPost.content,
            image: originalPost.image,
            postType: originalPost.postType,
            title: originalPost.title,
            eventDate: originalPost.eventDate,
            eventLocation: originalPost.eventLocation,
            repostedFrom: originalPost._id
        });

        const savedPost = await newPost.save();
        
        // Populate author and original post details
        await savedPost.populate("author", "name profilePhoto role headline");
        await savedPost.populate({
            path: "repostedFrom",
            populate: { path: "author", select: "name profilePhoto role" }
        });

        res.status(201).json(savedPost);
    } catch (err) {
        console.error("Error reposting post:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check user
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        const { content, image, postType, title, eventDate, eventLocation } = req.body;

        post.content = content || post.content;
        post.image = image !== undefined ? image : post.image;
        post.postType = postType || post.postType;
        post.title = title || post.title;
        post.eventDate = eventDate || post.eventDate;
        post.eventLocation = eventLocation || post.eventLocation;

        const updatedPost = await post.save();
        await updatedPost.populate("author", "name profilePhoto role headline");

        res.status(200).json(updatedPost);
    } catch (err) {
        console.error("Error updating post:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check user
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        await post.deleteOne();

        res.status(200).json({ message: "Post removed" });
    } catch (err) {
        console.error("Error deleting post:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get current user's activity (Posts, Comments, Reposts)
// @route   GET /api/posts/my-activity
// @access  Private
export const getMyActivity = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get all posts authored by the user (including their reposts)
        const myPosts = await Post.find({ author: userId })
            .populate("author", "name profilePhoto role headline")
            .populate("comments.user", "name profilePhoto")
            .populate({
                path: "repostedFrom",
                populate: { path: "author", select: "name profilePhoto role headline" }
            })
            .sort({ createdAt: -1 });

        // 2. Get posts where the user has commented (excluding their own posts to avoid duplication)
        const commentedPosts = await Post.find({
            "comments.user": userId,
            author: { $ne: userId }
        })
            .populate("author", "name profilePhoto role headline")
            .populate("comments.user", "name profilePhoto")
            .populate({
                path: "repostedFrom",
                populate: { path: "author", select: "name profilePhoto role headline" }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            posts: myPosts.filter(p => !p.repostedFrom),
            reposts: myPosts.filter(p => p.repostedFrom),
            comments: commentedPosts
        });
    } catch (err) {
        console.error("Error fetching activity:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
