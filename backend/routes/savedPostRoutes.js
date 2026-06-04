import express from "express";
import {
    savePost,
    unsavePost,
    getSavedPosts,
    checkIsSaved
} from "../controllers/savedPostController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // All routes are protected

router.route("/")
    .post(savePost)
    .get(getSavedPosts);

router.delete("/:postId", unsavePost);
router.get("/check/:postId", checkIsSaved);

export default router;
