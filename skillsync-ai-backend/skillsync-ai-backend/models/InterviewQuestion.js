const mongoose = require('mongoose');

const ConditionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    keywords: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    maxPoints: {
      type: Number,
      required: true,
      default: 3.5
    }
  },
  { _id: false }
);

const InterviewQuestionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
      default: 'ai_ml',
      index: true
    },
    topic: {
      type: String,
      trim: true,
      default: 'General'
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    idealAnswer: {
      type: String,
      required: [true, 'Ideal reference answer is required'],
      trim: true
    },
    conditions: [ConditionSchema],
    timeLimitSec: {
      type: Number,
      default: 180
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

InterviewQuestionSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('InterviewQuestion', InterviewQuestionSchema);
