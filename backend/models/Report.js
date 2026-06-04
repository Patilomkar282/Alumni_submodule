import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: ['Fake Profile', 'Abuse', 'Spam', 'Inappropriate Content', 'Other']
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    actionTaken: {
        type: String,
        enum: ['none', 'warned', 'suspended', 'deleted'],
        default: 'none'
    },
    adminNotes: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
