import mongoose from 'mongoose';

const successStorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    alumniId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional: if an admin wants to link a specific alumni profile
    },
    imageUrl: {
      type: String,
      required: true, // Requires an image to be uploaded
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The admin who created it
      required: true,
    },
  },
  { timestamps: true }
);

const SuccessStory = mongoose.model('SuccessStory', successStorySchema);

export default SuccessStory;
