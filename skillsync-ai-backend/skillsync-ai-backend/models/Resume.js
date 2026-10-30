const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    fileName: {
      type: String,
      default: 'resume.pdf'
    },
    fileType: {
      type: String,
      default: 'pdf'
    },
    rawText: {
      type: String,
      required: [true, 'Parsed resume text is required']
    },
    wordCount: {
      type: Number,
      default: 0
    },

    // spaCy NLP Named Entity Extraction Tags
    entities: {
      skills: [{ type: String }],
      frameworks: [{ type: String }],
      projects: [
        {
          title: String,
          description: String,
          technologies: [String]
        }
      ],
      education: [
        {
          institution: String,
          degree: String,
          cgpaOrPercentage: String,
          year: String
        }
      ],
      certifications: [{ type: String }]
    },

    // ATS Scoring Breakdown (0 - 100)
    atsEvaluation: {
      overallScore: { type: Number, default: 86 },
      keywordDensityScore: { type: Number, default: 88 },
      actionVerbScore: { type: Number, default: 82 },
      formattingScore: { type: Number, default: 94 },
      matchedKeywords: [{ type: String }],
      missingKeywords: [{ type: String }]
    },

    // Gemini API AI-Driven Suggestions
    aiSuggestions: [
      {
        id: Number,
        title: String,
        category: { type: String, enum: ['impact', 'keywords', 'formatting', 'skills'] },
        originalText: String,
        suggestedText: String,
        applied: { type: Boolean, default: false }
      }
    ],

    targetRole: {
      type: String,
      default: 'ai_ml'
    },
    // Student Identity Verification against registered profile
    studentValidation: {
      isMatch: { type: Boolean, default: true },
      matchScore: { type: Number, default: 100 },
      warnings: [{ type: String }],
      extractedEmail: { type: String, default: '' },
      extractedName: { type: String, default: '' },
      extractedPhone: { type: String, default: '' },
      validatedAt: { type: Date, default: Date.now }
    },
    lastScannedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Resume', ResumeSchema);
