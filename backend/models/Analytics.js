import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['student', 'alumni', 'admin'],
        required: true
    },
    connections: {
        sent: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        accepted: { type: Number, default: 0 },
        received: { type: Number, default: 0 } // Mostly for alumni
    },
    engagement: {
        postsCreated: { type: Number, default: 0 },
        totalLikesReceived: { type: Number, default: 0 },
        totalCommentsReceived: { type: Number, default: 0 }
    },
    sessions: {
        totalAttended: { type: Number, default: 0 },
        totalHours: { type: Number, default: 0 }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model("Analytics", analyticsSchema);
