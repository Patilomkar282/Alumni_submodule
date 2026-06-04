import mongoose from 'mongoose';

const verificationRequestSchema = new mongoose.Schema({
    alumni: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true  // One active request per alumni at a time
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },

    // Submitted by alumni
    linkedinUrl: { type: String, required: true },
    currentCompany: { type: String, required: true },
    currentRole: { type: String, required: true },
    graduationYear: { type: Number },
    branch: { type: String },

    // Document links (Google Drive / Dropbox / OneDrive URLs)
    documents: [{
        label: { type: String },   // e.g. "Offer Letter", "Employee ID"
        url: { type: String, required: true }
    }],

    additionalNotes: { type: String },

    // Admin review
    adminNotes: { type: String },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: { type: Date }

}, { timestamps: true });

export default mongoose.model('VerificationRequest', verificationRequestSchema);
