import mongoose from "mongoose";

const savedPostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    savedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure a user can't save the same post twice
savedPostSchema.index({ user: 1, post: 1 }, { unique: true });

export default mongoose.model("SavedPost", savedPostSchema);
