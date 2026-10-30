const mongoose = require('mongoose');

const InterviewViolationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'sessionId is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Violation type is required'],
      enum: [
        'PROHIBITED_OBJECT',
        'MULTIPLE_PERSONS',
        'NO_FACE',
        'LOOKING_AWAY',
        'TAB_SWITCH',
        'FULLSCREEN_EXIT',
        'MIC_NOISE',
        'CAMERA_BLOCKED'
      ]
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    },
    clientTimestamp: {
      type: Date,
      default: Date.now
    },
    serverTimestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    counted: {
      type: Boolean,
      default: true
    },
    warningNumber: {
      type: Number,
      default: null
    },
    details: {
      type: String,
      default: ''
    },
    snapshotRef: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

InterviewViolationSchema.index({ sessionId: 1, serverTimestamp: 1 });
InterviewViolationSchema.index({ sessionId: 1, type: 1, serverTimestamp: -1 });

module.exports = mongoose.model('InterviewViolation', InterviewViolationSchema);
