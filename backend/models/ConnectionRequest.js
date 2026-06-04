import mongoose from "mongoose";

const connectionRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    message: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add database indices for scalability and performance
connectionRequestSchema.index({ requester: 1, recipient: 1 });
connectionRequestSchema.index({ status: 1 });

export default mongoose.model("ConnectionRequest", connectionRequestSchema);
