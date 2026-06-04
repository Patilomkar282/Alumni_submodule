import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    host: { // The Alumni
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    student: { // The Student (Optional for global sessions)
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    isGlobal: { type: Boolean, default: false }, // If true, it's a webinar/event
    registeredStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    title: { type: String, required: true },
    description: { type: String },
    agenda: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    meetLink: { type: String },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    paymentStatus: {
        type: String,
        enum: ['free', 'pending', 'paid', 'refunded'],
        default: 'free'
    },
    price: { type: Number, default: 0 },
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        review: { type: String }
    }
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);
