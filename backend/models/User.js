import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  date: { type: Date },
  startTime: { type: String },
  endTime: { type: String },
  isBooked: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Made optional for passwordless OTP flow

  role: {
    type: String,
    enum: ['student', 'alumni', 'admin'],
    default: "student"
  },

  availabilityStatus: { 
    type: String, 
    enum: ['Available', 'Busy', 'Offline'], 
    default: 'Available' 
  },

  isProfileComplete: { type: Boolean, default: false },
  profilePhoto: { type: String },
  bannerPhoto: { type: String },
  bio: { type: String },
  location: { type: String },
  linkedinUrl: { type: String },
  githubUrl: { type: String },
  portfolioUrl: { type: String },
  headline: { type: String },
  skills: [{ type: String }],

  // Alumni Specific Fields
  currentPosition: { type: String },
  company: { type: String },
  graduationYear: { type: Number },
  branch: { type: String },
  expertiseAreas: [{ type: String }],
  availabilitySlots: [availabilitySchema],
  acceptedRequests: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },

  // Student Specific Fields
  currentYear: { type: Number }, // e.g., 1, 2, 3, 4
  college: { type: String }, // Student's college
  interestAreas: [{ type: String }],

  // Array of experiences (internships/jobs)
  experience: [{
    title: { type: String }, // Position
    company: { type: String }, // Company Name
    mode: { type: String, enum: ['On-site', 'Remote', 'Hybrid'] },
    location: { type: String }
  }],

  // Array of education details
  education: [{
    institution: { type: String }, // School, Highschool, College, PG
    degree: { type: String },
    fieldOfStudy: { type: String },
    location: { type: String }
  }],

  // Settings Fields
  isPublic: { type: Boolean, default: true },
  emailAlerts: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },

  status: { type: String, default: "active" },

  // Password Reset Fields
  resetOTP: { type: String },
  resetOTPExpires: { type: Date },

  // Login OTP Fields
  loginOTP: { type: String },
  loginOTPExpires: { type: Date },

  // Admin Tracking Fields
  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }, // Grants admin access regardless of role

}, { timestamps: true });

// Add database indices for scalability and performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ company: 1 });
userSchema.index({ branch: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ expertiseAreas: 1 });

// Atlas/Mongoose Smart Full-Text Search Index with Weights
userSchema.index({
    name: 'text',
    company: 'text',
    skills: 'text',
    expertiseAreas: 'text',
    branch: 'text',
    currentPosition: 'text'
}, {
    weights: {
        expertiseAreas: 10,
        skills: 8,
        company: 5,
        name: 4,
        branch: 3,
        currentPosition: 1
    },
    name: "MentorSearchIndex"
});

export default mongoose.model("User", userSchema);
