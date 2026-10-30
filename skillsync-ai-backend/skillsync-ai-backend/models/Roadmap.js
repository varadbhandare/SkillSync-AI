const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema(
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
    overallProgressPercentage: {
      type: Number,
      default: 50
    },
    weeks: [
      {
        weekNumber: Number,
        title: String,
        description: String,
        status: { type: String, enum: ['Completed', 'In Progress', 'Upcoming'], default: 'Upcoming' },
        resources: [
          {
            title: String,
            provider: String, // e.g. YouTube, freeCodeCamp, Coursera, edX, Official Docs, Roadmap.sh
            category: { type: String, enum: ['youtube', 'course_platform', 'learning_material'], default: 'course_platform' },
            duration: String,
            url: String,
            icon: String,
            isCompleted: { type: Boolean, default: false }
          }
        ],
        tasks: [
          {
            taskName: String,
            isDone: { type: Boolean, default: false }
          }
        ]
      }
    ],
    // Structured suggested roadmap progression for target role
    suggestedRoadmap: [
      {
        stepNumber: Number,
        phaseTitle: String,
        objective: String,
        estimatedDuration: String,
        resources: [
          {
            title: String,
            provider: String,
            category: { type: String, enum: ['youtube', 'course_platform', 'learning_material'], default: 'youtube' },
            duration: String,
            url: String,
            icon: String
          }
        ]
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Roadmap', RoadmapSchema);
