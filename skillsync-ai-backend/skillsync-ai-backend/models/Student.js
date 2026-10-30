const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Please provide student full name'],
      trim: true,
      default: 'Alex Morgan'
    },
    email: {
      type: String,
      required: [true, 'Please provide student email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ],
      default: 'student@university.edu'
    },
    phone: {
      type: String,
      trim: true,
      default: '+91 9876543210'
    },
    location: {
      type: String,
      trim: true,
      default: 'Pune, India'
    },
    bio: {
      type: String,
      trim: true,
      default: 'Final Year student specializing in Artificial Intelligence and Data Science.'
    },

    // Academic Information
    college: {
      type: String,
      trim: true,
      default: 'Annasaheb Dange College of Engineering and Technology, Ashta'
    },
    department: {
      type: String,
      trim: true,
      default: 'Department of Artificial Intelligence & Data Science'
    },
    degree: {
      type: String,
      trim: true,
      default: 'B. Tech'
    },
    rollNo: {
      type: String,
      trim: true,
      default: '4005'
    },
    cgpa: {
      type: String,
      trim: true,
      default: '8.85 / 10'
    },
    gradYear: {
      type: String,
      trim: true,
      default: '2026-27'
    },
    guide: {
      type: String,
      trim: true,
      default: 'Prof. S.A. Patil'
    },

    // Platform Handles & Portfolio Links
    platforms: {
      github: {
        type: String,
        trim: true,
        default: ''
      },
      leetcode: {
        type: String,
        trim: true,
        default: ''
      },
      linkedin: {
        type: String,
        trim: true,
        default: ''
      },
      kaggle: {
        type: String,
        trim: true,
        default: ''
      },
      portfolio: {
        type: String,
        trim: true,
        default: ''
      }
    },

    // Target Placement Role
    targetRole: {
      type: String,
      default: 'ai_ml'
    },
    customTargetRole: {
      type: String,
      trim: true,
      default: ''
    },

    // Live Aggregated Scores
    metrics: {
      compositeReadiness: { type: Number, default: 82 },
      atsResumeScore: { type: Number, default: 86 },
      leetcodeSolved: { type: Number, default: 280 },
      leetcodeRating: { type: Number, default: 1680 },
      interviewBehaviorScore: { type: Number, default: 80 },
      placementProbability: { type: Number, default: 89.5 }
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for initials
StudentSchema.virtual('initials').get(function () {
  if (!this.fullName) return 'ST';
  return this.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
});

module.exports = mongoose.model('Student', StudentSchema);
