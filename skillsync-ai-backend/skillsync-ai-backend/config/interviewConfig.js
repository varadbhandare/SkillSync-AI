/**
 * SkillSync AI - Central Mock Interview Configuration
 * Tunable parameters for proctoring integrity, warning cooldowns, question mixes, and scoring rubrics.
 */

const interviewConfig = {
  // Integrity & Warning Limits
  MAX_WARNINGS: 5,

  // Cooldown in seconds per violation type to prevent duplicate reports
  COOLDOWN_SECONDS: {
    PROHIBITED_OBJECT: 8,
    MULTIPLE_PERSONS: 8,
    NO_FACE: 8,
    LOOKING_AWAY: 8,
    TAB_SWITCH: 8,
    FULLSCREEN_EXIT: 8,
    MIC_NOISE: 8,
    CAMERA_BLOCKED: 8,
    default: 8
  },

  // Policy options (Instant termination vs warning count)
  POLICIES: {
    FULLSCREEN_EXIT_INSTANT_TERMINATE: false,
    TAB_SWITCH_INSTANT_TERMINATE: false,
    DEFAULT_SESSION_DURATION_MINUTES: 70, // 25 questions ~ 70 minutes
    MAX_ALLOWED_CLIENT_SKEW_MS: 30000 // 30 seconds tolerance for client timestamps
  },

  // Question Mix for Standard 25-Question Sessions
  QUESTION_MIX: {
    Easy: 10,
    Medium: 10,
    Hard: 5,
    TOTAL: 25
  },

  // Per-question difficulty weights (Total weighted points sum = 10*1.0 + 10*1.5 + 5*2.0 = 35)
  DIFFICULTY_WEIGHTS: {
    Easy: 1.0,
    Medium: 1.5,
    Hard: 2.0
  },

  // Per-question countdown time limits in seconds
  TIME_LIMITS_SEC: {
    Easy: 90,
    Medium: 120,
    Hard: 180
  },

  // Scoring rubric weights (Sum = 10.0, matching frontend UI labels /5.0, /3.0, /2.0)
  SCORING_WEIGHTS: {
    conceptMax: 5.0,
    depthMax: 3.0,
    clarityMax: 2.0,
    totalMax: 10.0
  },

  // Server-side deduction rates
  PENALTIES: {
    deductionPerCountedViolation: 0.15,
    maxNonTerminatedDeductions: 1.5,
    terminatedScoreCap: 3.0
  },

  // Accessory-Safe Proctoring Configuration (Headset/Mic false positive elimination)
  PROCTORING_ACCESSORIES: {
    phoneScoreThreshold: 0.60,
    minPhoneAreaRatio: 0.025, // Must occupy >= 2.5% of total webcam canvas area
    requiredStreakPasses: 8, // Must be detected in >= 8 of last 12 detector frames (~70%)
    totalDetectionHistoryWindow: 12,
    headExclusionZoneRatio: 0.40, // Top 40% of candidate bounding box excluded (head/earphones/mic zone)
    graceWindowSec: 5, // 5-second non-counted warning banner before escalating to counted violation
    allowedEquipment: ['headset', 'headphones', 'earphones', 'microphone']
  },

  // LLM Evaluation Engine Config
  LLM: {
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timeoutMs: parseInt(process.env.INTERVIEW_LLM_TIMEOUT_MS, 10) || 8000,
    temperature: 0.1,
    maxRetries: 1
  },

  // Performance & Caching
  CACHE: {
    QUESTION_CACHE_TTL_MS: 10 * 60 * 1000 // 10 minutes in-memory question bank cache
  }
};

module.exports = interviewConfig;
