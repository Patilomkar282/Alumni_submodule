import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    targetAudience: {
        type: String,
        enum: ['all', 'student', 'alumni'],
        default: 'all'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String // e.g. 'pdf', 'image'
    }],
    scheduledAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model("Announcement", announcementSchema);
