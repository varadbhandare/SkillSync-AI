const mongoose = require('mongoose');

const MentorMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'mentor', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    thoughtSummary: {
      type: String,
      default: ''
    },
    thoughtDurationSec: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    detectedIntent: {
      type: String,
      default: 'general'
    },
    platformSources: [
      {
        title: String,
        provider: String,
        channel: String,
        concept: String,
        badge: String,
        url: String,
        category: String,
        icon: String
      }
    ],
    suggestedActions: [String],
    versions: [
      {
        content: String,
        thoughtSummary: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    activeVersionIndex: {
      type: Number,
      default: 0
    },
    feedback: {
      rating: { type: String, enum: ['up', 'down', null], default: null },
      comment: { type: String, default: '' },
      submittedAt: { type: Date, default: null }
    }
  },
  { _id: true }
);

const MentorChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true
    },
    sessionId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      index: true
    },
    title: {
      type: String,
      default: 'Technical Mentorship Chat'
    },
    messages: [MentorMessageSchema],
    contextSummary: {
      type: String,
      default: 'Placement preparation guidance for Tier-1 engineering drives.'
    }
  },
  {
    timestamps: true
  }
);

MentorChatSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('MentorChat', MentorChatSchema);
