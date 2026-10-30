const mongoose = require('mongoose');

const MockInterviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    targetRole: {
      type: String,
      default: 'ai_ml'
    },
    sessionNumber: {
      type: Number,
      default: 1
    },
    questions: [
      {
        questionText: String,
        category: String, // e.g. Technical, Behavioral, System Design
        candidateResponse: String,
        candidateSpokenTranscript: String,
        wordCount: { type: Number, default: 0 },
        conceptRelevancePct: { type: Number, default: null },
        aiScore: { type: Number, min: 0, max: 10, default: null },
        aiFeedback: String,
        strengths: [String],
        improvements: [String],
        marksBreakdown: { type: mongoose.Schema.Types.Mixed },
        conditionsEvaluated: [{ type: mongoose.Schema.Types.Mixed }]
      }
    ],

    // Computer Vision & Telemetry Analytics (real values only; no synthetic defaults)
    behavioralAnalysis: {
      eyeContactPercentage: { type: Number, default: null },
      confidenceScore: { type: Number, default: null },
      headPoseStability: { type: String, default: null },
      blinkRatePerMinute: { type: Number, default: null },
      smileAndWarmthScore: { type: Number, default: null },
      speechClarityScore: { type: Number, default: null },
      audioVolumeLevel: { type: String, default: null },
      movementWarningCount: { type: Number, default: 0 },
      movementWarningsCount: { type: Number, default: 0 }, // Normalized naming alias for backward compatibility
      obstacleWarningCount: { type: Number, default: 0 },
      unexpectedObjectCount: { type: Number, default: 0 },
      secondPersonCount: { type: Number, default: 0 },
      noiseWarningCount: { type: Number, default: 0 },
      totalWarningsCount: { type: Number, default: 0 },
      excessiveMovementDetected: { type: Boolean, default: false },
      faceObstacleDetected: { type: Boolean, default: false },
      unexpectedObjectDetected: { type: Boolean, default: false },
      secondPersonDetected: { type: Boolean, default: false },
      excessiveNoiseDetected: { type: Boolean, default: false },
      unexpectedObjects: [String],
      movementWarnings: [mongoose.Schema.Types.Mixed],
      obstacleWarnings: [mongoose.Schema.Types.Mixed],
      noiseWarnings: [mongoose.Schema.Types.Mixed],
      secondPersonWarnings: [mongoose.Schema.Types.Mixed],
      unexpectedObjectWarnings: [mongoose.Schema.Types.Mixed]
    },

    status: {
      type: String,
      enum: ['Completed', 'Terminated_Violations', 'In_Progress'],
      default: 'In_Progress'
    },
    isTerminated: {
      type: Boolean,
      default: false
    },
    terminationReason: {
      type: String,
      default: ''
    },
    totalWarnings: {
      type: Number,
      default: 0
    },
    violations: [mongoose.Schema.Types.Mixed],

    overallInterviewScore: {
      type: Number,
      default: null // Real computed score only (no fake 8.8 default)
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MockInterview', MockInterviewSchema);
