const mongoose = require('mongoose');

const PlacementReadinessSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true
    },
    compositeScore: {
      type: Number,
      default: 82.0
    },
    grade: {
      type: String,
      default: 'A'
    },
    percentileRank: {
      type: String,
      default: 'Top 15%'
    },

    // 4 Composite Weights from Project Synopsis
    weightsBreakdown: {
      resumeScore: { score: Number, weight: { type: Number, default: 0.30 } },
      leetcodeScore: { score: Number, weight: { type: Number, default: 0.25 } },
      githubScore: { score: Number, weight: { type: Number, default: 0.20 } },
      mockInterviewScore: { score: Number, weight: { type: Number, default: 0.25 } }
    },

    // 360 Degree Competency Vector
    competency360: [
      {
        dimension: String, // e.g. DSA, AI Tech, System Design, Backend, Code Quality, Communication
        candidateScore: Number,
        benchmarkScore: Number
      }
    ],

    // ML Placement Probability Forecast
    predictionModel: {
      algorithm: { type: String, default: 'XGBoost v2.4 Multi-Class' },
      overallProbability: { type: Number, default: 89.5 },
      tier1ProductChance: { type: Number, default: 88 },
      aiSpecializedChance: { type: Number, default: 92 },
      itServicesChance: { type: Number, default: 95 },
      estimatedCtcBracket: { type: String, default: '8.5 LPA - 18.0 LPA' }
    },

    // Historical Progression
    growthHistory: [
      {
        weekLabel: String,
        score: Number,
        recordedAt: Date
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PlacementReadiness', PlacementReadinessSchema);
