const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session must belong to an authenticated user'],
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true
    },
    targetRole: {
      type: String,
      trim: true,
      default: 'ai_ml'
    },
    status: {
      type: String,
      enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED'],
      default: 'CREATED',
      index: true
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewQuestion'
      }
    ],
    difficultyBreakdown: {
      Easy: { type: Number, default: 10 },
      Medium: { type: Number, default: 10 },
      Hard: { type: Number, default: 5 },
      total: { type: Number, default: 25 }
    },
    currentQuestionIndex: {
      type: Number,
      default: 0
    },
    currentQuestionStartedAt: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date,
      default: null
    },
    endsAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    warningCount: {
      type: Number,
      default: 0
    },
    consentGiven: {
      type: Boolean,
      default: true
    },
    declaredEquipment: [
      {
        type: { type: String, trim: true },
        declaredAt: { type: Date, default: Date.now }
      }
    ],
    terminationReason: {
      type: String,
      default: ''
    },
    overallScore: {
      type: Number,
      default: 0
    },
    weightedScore: {
      type: Number,
      default: 0 // Real score scaled to 100
    },
    summary: {
      totalQuestions: { type: Number, default: 25 },
      answeredCount: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      weightedScore: { type: Number, default: 0 },
      integrityRating: { type: String, default: 'High' }, // High, Medium, Flagged
      difficultyStats: { type: mongoose.Schema.Types.Mixed, default: {} },
      totalViolationsReported: { type: Number, default: 0 },
      totalViolationsCounted: { type: Number, default: 0 },
      violationBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
      recommendations: [{ type: String }]
    }
  },
  {
    timestamps: true
  }
);

InterviewSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
