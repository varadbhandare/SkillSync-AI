const mongoose = require('mongoose');

const ConditionEvaluationSchema = new mongoose.Schema(
  {
    conditionName: { type: String, required: true },
    isSatisfied: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 3.5 },
    matchedTerms: [{ type: String }]
  },
  { _id: false }
);

const InterviewAnswerSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'sessionId is required'],
      index: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: [true, 'questionId is required']
    },
    transcriptRaw: {
      type: String,
      default: '',
      trim: true
    },
    transcriptClean: {
      type: String,
      default: '',
      trim: true
    },
    wordCount: {
      type: Number,
      default: 0
    },
    scores: {
      conceptMarks: { type: Number, default: 0 },
      depthMarks: { type: Number, default: 0 },
      clarityMarks: { type: Number, default: 0 },
      penaltiesDeducted: { type: Number, default: 0 }
    },
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 0
    },
    conceptRelevancePct: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      default: ''
    },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    conditionsEvaluated: [ConditionEvaluationSchema],
    scoredBy: {
      type: String,
      enum: ['LLM', 'RULES'],
      default: 'RULES'
    }
  },
  {
    timestamps: true
  }
);

// Ensure one answer per question per session
InterviewAnswerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('InterviewAnswer', InterviewAnswerSchema);
