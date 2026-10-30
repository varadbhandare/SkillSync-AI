const mongoose = require('mongoose');

const SkillGapSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    targetRole: {
      type: String,
      required: true,
      default: 'ai_ml'
    },
    benchmarkTitle: {
      type: String,
      default: 'Tier-1 AI & Machine Learning Engineer (2026-27)'
    },
    totalBenchmarkSkills: {
      type: Number,
      default: 20
    },
    matchedSkillsCount: {
      type: Number,
      default: 16
    },
    semanticMatchPercentage: {
      type: Number,
      default: 84.5
    },

    // Competency Areas Breakdown
    competencyAreas: [
      {
        category: String, // e.g. Deep Learning, Data Engineering, MLOps, Computer Vision
        fitPercentage: Number,
        status: { type: String, enum: ['Mastered', 'Moderate', 'Action Required'] },
        matchedSkills: [String],
        missingSkills: [String]
      }
    ],

    // Missing Skills by Priority
    missingSkillsList: [
      {
        skillName: String,
        priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'High' },
        category: String,
        importanceExplanation: String
      }
    ],

    lastCalculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SkillGap', SkillGapSchema);
