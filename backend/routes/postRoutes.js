import express from "express";
import {
    createPost,
    getAllPosts,
    likePost,
    addComment,
    replyToComment,
    deleteComment,
    editComment,
    repostPost,
    updatePost,
    deletePost,
    getMyActivity
} from "../controllers/postController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
    .post(protect, createPost)
    .get(protect, getAllPosts);

router.route("/my-activity").get(protect, getMyActivity);

router.route("/:id")
    .put(protect, updatePost)
    .delete(protect, deletePost);

router.route("/:id/like").put(protect, likePost);
router.route("/:id/repost").post(protect, repostPost);
router.route("/:id/comment").post(protect, addComment);

router.route("/:postId/comments/:commentId/reply").post(protect, replyToComment);
router.route("/:postId/comments/:commentId")
    .put(protect, editComment)
    .delete(protect, deleteComment);

export default router;
