import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: ['connection_request', 'connection_accepted', 'new_message', 'group_invite', 'verification_submitted', 'verification_approved', 'verification_rejected'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    // Action Status — for connection_request and group_invite notifications
    // pending: User hasn't taken action yet
    // accepted: User accepted the request/invite
    // rejected: User rejected the request/invite
    actionStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    relatedGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
