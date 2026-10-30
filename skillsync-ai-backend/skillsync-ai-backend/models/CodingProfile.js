const mongoose = require('mongoose');

const CodingProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true
    },

    // GitHub Status & Live Analytics
    isGithubConnected: {
      type: Boolean,
      default: false
    },
    github: {
      username: { type: String, default: '' },
      name: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
      bio: { type: String, default: '' },
      publicReposCount: { type: Number, default: 0 },
      totalStars: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      healthScore: { type: Number, default: 0 },
      languageBreakdown: [
        {
          language: String,
          percentage: Number,
          count: Number,
          color: String
        }
      ],
      featuredRepositories: [
        {
          name: String,
          description: String,
          language: String,
          stars: Number,
          forks: Number,
          url: String
        }
      ],
      lastFetchedAt: Date,
      error: String
    },

    // LeetCode Status & Live DSA Metrics
    isLeetcodeConnected: {
      type: Boolean,
      default: false
    },
    leetcode: {
      username: { type: String, default: '' },
      totalSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      reputation: { type: Number, default: 0 },
      acceptanceRate: { type: Number, default: 0 },
      lastFetchedAt: Date,
      error: String
    },

    // Overall Multi-Platform Coding Performance Analysis
    overallPerformance: {
      compositeScore: { type: Number, default: 0 },
      tier: { type: String, default: 'Not Linked' },
      dsaScore: { type: Number, default: 0 },
      projectScore: { type: Number, default: 0 },
      strengths: [String],
      improvements: [String],
      summary: { type: String, default: '' },
      radarBreakdown: {
        dsa: { type: Number, default: 0 },
        projects: { type: Number, default: 0 },
        languages: { type: Number, default: 0 },
        consistency: { type: Number, default: 0 },
        openSource: { type: Number, default: 0 }
      }
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CodingProfile', CodingProfileSchema);
