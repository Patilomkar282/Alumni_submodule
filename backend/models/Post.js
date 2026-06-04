import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true
    },
    postType: {
        type: String,
        enum: ['post', 'event', 'article'],
        default: 'post'
    },
    title: {
        type: String
    },
    eventDate: {
        type: Date
    },
    eventLocation: {
        type: String
    },
    image: {
        type: String // URL to the image
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    repostedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    comments: [commentSchema]
}, { timestamps: true });

// Add database indices for scalability and performance
postSchema.index({ author: 1 });
postSchema.index({ postType: 1 });
postSchema.index({ createdAt: -1 });

export default mongoose.model("Post", postSchema);
