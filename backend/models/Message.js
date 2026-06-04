import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    content: {
        type: String,
        default: ''
    },
    read: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String }
    }],
    fileUrl: { type: String },
    fileName: { type: String },
    type: {
        type: String,
        enum: ['text', 'video_call', 'file', 'audio'],
        default: 'text'
    },
    callDuration: {
        type: Number, // In seconds
        default: 0
    },
    callStatus: {
        type: String,
        enum: ['missed', 'completed', 'declined', null],
        default: null
    }
}, { timestamps: true });

// Add database indices for scalability and performance
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ group: 1 });
messageSchema.index({ createdAt: -1 });

export default mongoose.model("Message", messageSchema);
