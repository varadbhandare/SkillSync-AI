const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { protect } = require('../middleware/authMiddleware');
const interviewConfig = require('../config/interviewConfig');

const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewSession = require('../models/InterviewSession');
const InterviewAnswer = require('../models/InterviewAnswer');
const InterviewViolation = require('../models/InterviewViolation');
const MockInterview = require('../models/MockInterview');
const Student = require('../models/Student');
const User = require('../models/User');
const { evaluateAnswer } = require('../services/interviewScoringService');

// In-memory cache for questions bank
let cachedQuestions = null;
let cacheExpiry = 0;

/**
 * Select a 25-question interview set: 10 Easy, 10 Medium, 5 Hard
 * Strictly ordered: Easy (0-9) -> Medium (10-19) -> Hard (20-24)
 * Minimizes repetition by avoiding questions used in the candidate's last 2 sessions.
 */
async function selectSessionQuestions(role = 'ai_ml', userId = null) {
  const now = Date.now();
  if (!cachedQuestions || now > cacheExpiry) {
    cachedQuestions = await InterviewQuestion.find({ isActive: true }).lean();
    cacheExpiry = now + interviewConfig.CACHE.QUESTION_CACHE_TTL_MS;
  }

  // Find candidate's question IDs from their last 2 sessions to avoid repetition
  const recentlyUsedIds = new Set();
  if (userId) {
    try {
      const recentSessions = await InterviewSession.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(2)
        .select('questionIds')
        .lean();
      for (const s of recentSessions) {
        if (Array.isArray(s.questionIds)) {
          s.questionIds.forEach((id) => recentlyUsedIds.add(String(id)));
        }
      }
    } catch (e) {
      console.warn('[Session Questions] Error querying recent sessions for dedup:', e.message);
    }
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickForDifficulty(diff, count) {
    const roleCandidates = cachedQuestions.filter((q) => q.role === role && q.difficulty === diff);
    const coreCandidates = cachedQuestions.filter((q) => q.role === 'core' && q.difficulty === diff);
    const otherCandidates = cachedQuestions.filter(
      (q) => q.role !== role && q.role !== 'core' && q.difficulty === diff
    );

    // Unused first, then used if pool is small
    const roleUnused = shuffle(roleCandidates.filter((q) => !recentlyUsedIds.has(String(q._id))));
    const coreUnused = shuffle(coreCandidates.filter((q) => !recentlyUsedIds.has(String(q._id))));
    const roleUsed = shuffle(roleCandidates.filter((q) => recentlyUsedIds.has(String(q._id))));
    const coreUsed = shuffle(coreCandidates.filter((q) => recentlyUsedIds.has(String(q._id))));
    const otherPool = shuffle(otherCandidates);

    const pool = [...roleUnused, ...coreUnused, ...roleUsed, ...coreUsed, ...otherPool];
    return pool.slice(0, count);
  }

  const easy = pickForDifficulty('Easy', interviewConfig.QUESTION_MIX.Easy || 10);
  const medium = pickForDifficulty('Medium', interviewConfig.QUESTION_MIX.Medium || 10);
  const hard = pickForDifficulty('Hard', interviewConfig.QUESTION_MIX.Hard || 5);

  // Return strictly ordered: Easy -> Medium -> Hard
  return [...easy, ...medium, ...hard];
}

// Rate limiters for anti-abuse
const violationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many violation reports from this client. Please slow down.' }
});

const answerRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Rate limit exceeded for answer submissions.' }
});

// Zod schemas for input validation
const ViolationReportSchema = z.object({
  type: z.enum([
    'PROHIBITED_OBJECT',
    'MULTIPLE_PERSONS',
    'NO_FACE',
    'LOOKING_AWAY',
    'TAB_SWITCH',
    'FULLSCREEN_EXIT',
    'MIC_NOISE',
    'CAMERA_BLOCKED'
  ]),
  confidence: z.number().min(0).max(1).optional().default(1.0),
  clientTimestamp: z.string().datetime().or(z.number()).optional(),
  details: z.string().max(300).optional().default('')
});

const AnswerSubmissionSchema = z.object({
  transcript: z.string().max(10000).optional().default(''),
  questionId: z.string().optional()
});

/**
 * Sanitize question for client transmission (hide ideal answer and keywords)
 */
function sanitizeQuestion(q) {
  if (!q) return null;
  const timeLimit =
    q.timeLimitSec ||
    (q.difficulty === 'Easy' ? 90 : q.difficulty === 'Medium' ? 120 : 180);

  return {
    id: q._id,
    role: q.role,
    topic: q.topic,
    difficulty: q.difficulty,
    text: q.text,
    timeLimitSec: timeLimit,
    conditions: (q.conditions || []).map((c) => ({
      name: c.name,
      maxPoints: c.maxPoints
    }))
  };
}

// =========================================================================
// 1. SESSION LIFECYCLE MANAGEMENT
// =========================================================================

// @route   GET /api/modules/interviews
// @desc    LIST authenticated user's sessions
router.get('/', protect, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/modules/interviews
// @desc    DELETE authenticated user's sessions only
router.delete('/', protect, async (req, res) => {
  try {
    const userSessions = await InterviewSession.find({ user: req.user._id }).select('_id').lean();
    const sessionIds = userSessions.map((s) => s._id);

    if (sessionIds.length > 0) {
      await InterviewViolation.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewAnswer.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewSession.deleteMany({ user: req.user._id });
    }

    res.json({
      success: true,
      message: `Deleted ${sessionIds.length} interview session(s) belonging to current user.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/modules/interviews/sessions
// @desc    CREATE & START a new proctored mock interview session (25 questions: 10 Easy + 10 Medium + 5 Hard)
router.post('/sessions', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    let student = null;

    if (req.user.student) {
      student = await Student.findById(req.user.student);
    }
    if (!student && req.user.email) {
      student = await Student.findOne({ email: req.user.email });
    }

    const { targetRole, consentGiven, declaredEquipment } = req.body;
    const effectiveRole = targetRole || (student ? student.targetRole : 'ai_ml');

    // Select 25 questions with 10 Easy / 10 Medium / 5 Hard distribution
    const questions = await selectSessionQuestions(effectiveRole, userId);
    if (!questions || questions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Question bank is empty. Please run question seed.'
      });
    }

    const questionIds = questions.map((q) => q._id);
    const sessionDurationMs = (interviewConfig.POLICIES.DEFAULT_SESSION_DURATION_MINUTES || 70) * 60 * 1000;
    const now = new Date();

    const difficultyBreakdown = {
      Easy: questions.filter((q) => q.difficulty === 'Easy').length,
      Medium: questions.filter((q) => q.difficulty === 'Medium').length,
      Hard: questions.filter((q) => q.difficulty === 'Hard').length,
      total: questions.length
    };

    const session = await InterviewSession.create({
      user: userId,
      student: student ? student._id : null,
      targetRole: effectiveRole,
      status: 'IN_PROGRESS',
      questionIds,
      difficultyBreakdown,
      currentQuestionIndex: 0,
      currentQuestionStartedAt: now,
      startedAt: now,
      endsAt: new Date(now.getTime() + sessionDurationMs),
      warningCount: 0,
      consentGiven: consentGiven !== false,
      declaredEquipment: Array.isArray(declaredEquipment)
        ? declaredEquipment.map((eq) => ({ type: eq, declaredAt: now }))
        : [],
      summary: {
        totalQuestions: questionIds.length,
        answeredCount: 0,
        averageScore: 0,
        weightedScore: 0
      }
    });

    const firstQuestion = questions[0];

    const questionsSummary = questions.map((q, idx) => ({
      index: idx,
      difficulty: q.difficulty,
      topic: q.topic,
      timeLimitSec: q.timeLimitSec || (q.difficulty === 'Easy' ? 90 : q.difficulty === 'Medium' ? 120 : 180)
    }));

    res.status(201).json({
      success: true,
      message: 'Interview session created and active',
      session: {
        id: session._id,
        targetRole: session.targetRole,
        status: session.status,
        startedAt: session.startedAt,
        endsAt: session.endsAt,
        currentQuestionIndex: 0,
        totalQuestions: questionIds.length,
        difficultyBreakdown,
        warningCount: 0,
        maxWarnings: interviewConfig.MAX_WARNINGS,
        totalDurationMinutes: interviewConfig.POLICIES.DEFAULT_SESSION_DURATION_MINUTES || 70
      },
      currentQuestion: sanitizeQuestion(firstQuestion),
      questionsSummary
    });
  } catch (err) {
    console.error('[Session Create Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/modules/interviews/sessions
// @desc    LIST authenticated user's sessions only
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/modules/interviews/sessions/:id
// @desc    GET session state for refresh recovery
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('questionIds');

    if (!session) {
      return res.status(404).json({ success: false, error: 'Interview session not found or unauthorized' });
    }

    const answers = await InterviewAnswer.find({ sessionId: session._id }).lean();
    const violations = await InterviewViolation.find({ sessionId: session._id })
      .sort({ serverTimestamp: -1 })
      .limit(10)
      .lean();

    const questions = session.questionIds || [];
    const idx = session.currentQuestionIndex || 0;
    const currentQ = idx < questions.length ? sanitizeQuestion(questions[idx]) : null;

    // Calculate time remaining on current question
    let currentQuestionTimeRemainingSec = null;
    if (currentQ) {
      const qStarted = session.currentQuestionStartedAt
        ? new Date(session.currentQuestionStartedAt).getTime()
        : Date.now();
      const elapsedSec = Math.floor((Date.now() - qStarted) / 1000);
      currentQuestionTimeRemainingSec = Math.max(0, currentQ.timeLimitSec - elapsedSec);
    }

    // Session-wide remaining time
    const sessionRemainingSec = Math.max(0, Math.floor((new Date(session.endsAt).getTime() - Date.now()) / 1000));

    // Summary of question status for segmented progress bar
    const answeredMap = new Map();
    answers.forEach((a) => answeredMap.set(String(a.questionId), a));

    const questionsSummary = questions.map((q, i) => ({
      index: i,
      id: q._id,
      difficulty: q.difficulty,
      topic: q.topic,
      isAnswered: answeredMap.has(String(q._id)),
      score: answeredMap.get(String(q._id))?.totalScore || null
    }));

    res.json({
      success: true,
      session: {
        id: session._id,
        targetRole: session.targetRole,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: questions.length,
        difficultyBreakdown: session.difficultyBreakdown || { Easy: 10, Medium: 10, Hard: 5, total: 25 },
        warningCount: session.warningCount,
        maxWarnings: interviewConfig.MAX_WARNINGS,
        startedAt: session.startedAt,
        endsAt: session.endsAt,
        currentQuestionStartedAt: session.currentQuestionStartedAt,
        currentQuestionTimeRemainingSec,
        sessionRemainingSec,
        isTerminated: session.status === 'TERMINATED',
        terminationReason: session.terminationReason,
        overallScore: session.overallScore,
        weightedScore: session.weightedScore
      },
      currentQuestion: currentQ,
      questionsSummary,
      answersCount: answers.length,
      violationsCount: violations.length,
      recentViolations: violations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/modules/interviews/sessions/:id/question
// @desc    GET current sanitized question with countdown limit
router.get('/sessions/:id/question', protect, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('questionIds');

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or unauthorized' });
    }

    if (session.status === 'TERMINATED') {
      return res.status(409).json({
        success: false,
        error: 'Session is terminated due to proctoring policy limit.',
        isTerminated: true
      });
    }

    if (session.status === 'COMPLETED') {
      return res.status(409).json({
        success: false,
        error: 'Session is already completed.',
        isCompleted: true
      });
    }

    const idx = session.currentQuestionIndex || 0;
    const questions = session.questionIds || [];
    if (idx >= questions.length) {
      return res.json({
        success: true,
        isFinished: true,
        message: 'All 25 questions in this session have been completed.'
      });
    }

    const currentQ = sanitizeQuestion(questions[idx]);
    const qStarted = session.currentQuestionStartedAt
      ? new Date(session.currentQuestionStartedAt).getTime()
      : Date.now();
    const elapsedSec = Math.floor((Date.now() - qStarted) / 1000);
    const timeRemainingSec = Math.max(0, currentQ.timeLimitSec - elapsedSec);

    res.json({
      success: true,
      currentQuestionIndex: idx,
      totalQuestions: questions.length,
      question: currentQ,
      timeRemainingSec
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 2. PROCTORING VIOLATION REPORTING (ATOMIC SERVER-SIDE TRUTH)
// =========================================================================

// @route   POST /api/modules/interviews/sessions/:id/violations
// @desc    REPORT a proctoring violation; server applies cooldown and atomic warning increment
router.post('/sessions/:id/violations', protect, violationRateLimiter, async (req, res) => {
  try {
    const validation = ViolationReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.format() });
    }

    const { type, confidence, details } = validation.data;
    const sessionId = req.params.id;
    const userId = req.user._id;

    // 1. Verify session exists, belongs to user, and is IN_PROGRESS
    const session = await InterviewSession.findOne({
      _id: sessionId,
      user: userId
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or unauthorized' });
    }

    if (session.status === 'TERMINATED') {
      return res.status(409).json({
        counted: false,
        warningCount: session.warningCount,
        warningsRemaining: 0,
        terminated: true,
        message: 'Interview is already terminated.'
      });
    }

    if (session.status === 'COMPLETED') {
      return res.status(409).json({
        counted: false,
        warningCount: session.warningCount,
        warningsRemaining: 0,
        terminated: false,
        message: 'Interview is already completed.'
      });
    }

    // 2. Check violation cooldown per violation type
    const cooldownSec = interviewConfig.COOLDOWN_SECONDS[type] || interviewConfig.COOLDOWN_SECONDS.default;
    const cooldownMs = cooldownSec * 1000;
    const now = new Date();

    const lastViolation = await InterviewViolation.findOne({
      sessionId,
      type
    }).sort({ serverTimestamp: -1 });

    const isInsideCooldown = lastViolation && now.getTime() - lastViolation.serverTimestamp.getTime() < cooldownMs;

    // If inside cooldown, persist with counted = false and return without incrementing warnings
    if (isInsideCooldown) {
      await InterviewViolation.create({
        sessionId,
        userId,
        type,
        confidence,
        details,
        counted: false,
        serverTimestamp: now,
        warningNumber: null
      });

      return res.json({
        counted: false,
        warningCount: session.warningCount,
        warningsRemaining: Math.max(0, interviewConfig.MAX_WARNINGS - session.warningCount),
        terminated: false,
        message: `Violation reported within ${cooldownSec}s cooldown. Logged for audit without penalty.`
      });
    }

    // 3. Atomically increment warningCount only if < MAX_WARNINGS
    const updatedSession = await InterviewSession.findOneAndUpdate(
      {
        _id: sessionId,
        user: userId,
        status: 'IN_PROGRESS',
        warningCount: { $lt: interviewConfig.MAX_WARNINGS }
      },
      {
        $inc: { warningCount: 1 }
      },
      { new: true }
    );

    // If update failed, session was either already terminated or concurrent request hit limit
    if (!updatedSession) {
      const current = await InterviewSession.findById(sessionId);
      return res.json({
        counted: false,
        warningCount: current ? current.warningCount : interviewConfig.MAX_WARNINGS,
        warningsRemaining: 0,
        terminated: true,
        message: 'Maximum proctoring limit reached.'
      });
    }

    const currentWarningCount = updatedSession.warningCount;
    const isTerminated = currentWarningCount >= interviewConfig.MAX_WARNINGS;

    // Record counted violation
    await InterviewViolation.create({
      sessionId,
      userId,
      type,
      confidence,
      details,
      counted: true,
      serverTimestamp: now,
      warningNumber: currentWarningCount
    });

    // If 5th warning reached, transition status to TERMINATED
    if (isTerminated) {
      await InterviewSession.updateOne(
        { _id: sessionId },
        {
          $set: {
            status: 'TERMINATED',
            terminationReason: `Disconnected after reaching 5 proctoring warnings (policy violation: ${type}).`,
            completedAt: now
          }
        }
      );
    }

    res.json({
      counted: true,
      warningCount: currentWarningCount,
      warningsRemaining: Math.max(0, interviewConfig.MAX_WARNINGS - currentWarningCount),
      terminated: isTerminated,
      message: isTerminated
        ? `5th proctoring warning reached [${type}]. Assessment terminated.`
        : `Warning #${currentWarningCount} of ${interviewConfig.MAX_WARNINGS} logged: ${type}`
    });
  } catch (err) {
    console.error('[Violation Handler Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. ANSWER EVALUATION & SUBMISSION
// =========================================================================

// @route   POST /api/modules/interviews/sessions/:id/answer
// @desc    SUBMIT and evaluate candidate response for current question; advances question
router.post('/sessions/:id/answer', protect, answerRateLimiter, async (req, res) => {
  try {
    const validation = AnswerSubmissionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.format() });
    }

    const { transcript, questionId } = validation.data;
    const sessionId = req.params.id;
    const userId = req.user._id;

    // Verify session
    const session = await InterviewSession.findOne({
      _id: sessionId,
      user: userId
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or unauthorized' });
    }

    if (session.status === 'TERMINATED') {
      return res.status(409).json({
        success: false,
        error: 'Assessment is terminated due to proctoring limit. Further answers are rejected.',
        isTerminated: true
      });
    }

    if (session.status === 'COMPLETED') {
      return res.status(409).json({
        success: false,
        error: 'Assessment is already finalized and completed.',
        isCompleted: true
      });
    }

    // Determine current question from DB (never client-supplied conditions)
    let targetQuestionId = questionId;
    if (!targetQuestionId) {
      const idx = session.currentQuestionIndex || 0;
      targetQuestionId = session.questionIds[idx];
    }

    const question = await InterviewQuestion.findById(targetQuestionId);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found in question bank' });
    }

    // Get verified server-side counted violations count for this session
    const countedViolations = await InterviewViolation.countDocuments({
      sessionId: session._id,
      counted: true
    });

    // Run evidence-based scoring service
    const evalResult = await evaluateAnswer(question, transcript, countedViolations, false);

    // Save or update InterviewAnswer atomically
    const answerDoc = await InterviewAnswer.findOneAndUpdate(
      {
        sessionId: session._id,
        questionId: question._id
      },
      {
        $set: {
          transcriptRaw: transcript,
          transcriptClean: transcript.toLowerCase(),
          wordCount: evalResult.wordCount,
          scores: evalResult.marksBreakdown,
          totalScore: evalResult.aiScore,
          conceptRelevancePct: evalResult.conceptRelevancePct,
          feedback: evalResult.aiFeedback,
          strengths: evalResult.strengths,
          improvements: evalResult.improvements,
          conditionsEvaluated: evalResult.conditionsEvaluated,
          scoredBy: evalResult.scoredBy
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Increment question index and reset current question start time
    const nextIdx = (session.currentQuestionIndex || 0) + 1;
    const now = new Date();
    await InterviewSession.updateOne(
      { _id: session._id },
      {
        $set: {
          currentQuestionIndex: nextIdx,
          currentQuestionStartedAt: now
        },
        $inc: { 'summary.answeredCount': 1 }
      }
    );

    res.json({
      success: true,
      evaluation: evalResult,
      answerId: answerDoc._id,
      nextQuestionIndex: nextIdx,
      isLastQuestion: nextIdx >= session.questionIds.length
    });
  } catch (err) {
    console.error('[Answer Submission Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/modules/interviews/sessions/:id/finish
// @desc    FINALIZE 25-question interview session, compute weighted score out of 100 & update student
router.post('/sessions/:id/finish', protect, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;

    const session = await InterviewSession.findOne({
      _id: sessionId,
      user: userId
    }).populate('questionIds');

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const answers = await InterviewAnswer.find({ sessionId: session._id }).lean();
    const violations = await InterviewViolation.find({ sessionId: session._id }).lean();

    const countedViolations = violations.filter((v) => v.counted);
    const violationBreakdown = {};
    violations.forEach((v) => {
      violationBreakdown[v.type] = (violationBreakdown[v.type] || 0) + 1;
    });

    // 25-Question Weighted Scoring: Easy weight 1.0, Medium weight 1.5, Hard weight 2.0
    // Total possible weight: 10*1.0 + 10*1.5 + 5*2.0 = 35.0
    let totalWeightedPoints = 0;
    let totalPossibleWeight = 0;
    const difficultyStats = {
      Easy: { count: 0, answered: 0, totalScore: 0, avgScore: 0 },
      Medium: { count: 0, answered: 0, totalScore: 0, avgScore: 0 },
      Hard: { count: 0, answered: 0, totalScore: 0, avgScore: 0 }
    };

    const questions = session.questionIds || [];
    for (const q of questions) {
      const diff = q.difficulty || 'Medium';
      const weight = interviewConfig.DIFFICULTY_WEIGHTS[diff] || 1.0;
      totalPossibleWeight += weight;

      if (difficultyStats[diff]) {
        difficultyStats[diff].count++;
      }

      const ans = answers.find((a) => String(a.questionId) === String(q._id));
      if (ans) {
        const score = ans.totalScore || 0;
        totalWeightedPoints += score * weight;
        if (difficultyStats[diff]) {
          difficultyStats[diff].answered++;
          difficultyStats[diff].totalScore += score;
        }
      }
    }

    for (const diff of ['Easy', 'Medium', 'Hard']) {
      if (difficultyStats[diff].answered > 0) {
        difficultyStats[diff].avgScore = parseFloat(
          (difficultyStats[diff].totalScore / difficultyStats[diff].answered).toFixed(1)
        );
      }
    }

    // Weighted score out of 100: (totalWeightedPoints / (totalPossibleWeight * 10)) * 100
    const weightedScore =
      totalPossibleWeight > 0
        ? parseFloat(((totalWeightedPoints / totalPossibleWeight) * 10).toFixed(1))
        : 0;

    // Overall score on 10-point scale for consistency
    const overallScore = parseFloat((weightedScore / 10).toFixed(1));

    let integrityRating = 'High';
    if (countedViolations.length >= 4) integrityRating = 'Flagged';
    else if (countedViolations.length >= 2) integrityRating = 'Medium';

    const recommendations = [];
    if (weightedScore >= 80) {
      recommendations.push(
        'Outstanding technical communication and problem-solving depth across Easy, Medium, and Hard tiers.'
      );
    } else if (weightedScore >= 60) {
      recommendations.push(
        'Solid foundational mastery; strengthen trade-off analyses, concurrency limits, and architectural deep-dives.'
      );
    } else {
      recommendations.push(
        'Review core algorithmic concepts, system principles, and practice structured technical speech articulation.'
      );
    }

    if (difficultyStats.Hard.answered > 0 && difficultyStats.Hard.avgScore < 5.0) {
      recommendations.push(
        'Deep-dive into Hard-tier distributed systems and advanced algorithmic complexity trade-offs.'
      );
    }

    if (countedViolations.length > 0) {
      recommendations.push(`Proctoring audit: Candidate logged ${countedViolations.length} verified warnings.`);
    }

    session.status = session.status === 'TERMINATED' ? 'TERMINATED' : 'COMPLETED';
    session.overallScore = overallScore;
    session.weightedScore = weightedScore;
    session.completedAt = new Date();
    session.summary = {
      totalQuestions: questions.length,
      answeredCount: answers.length,
      averageScore: overallScore,
      weightedScore,
      integrityRating,
      difficultyStats,
      totalViolationsReported: violations.length,
      totalViolationsCounted: countedViolations.length,
      violationBreakdown,
      recommendations
    };

    await session.save();

    // Update Student record with genuine behavioral & readiness scores
    if (session.student) {
      const student = await Student.findById(session.student);
      if (student) {
        if (!student.metrics) student.metrics = {};
        student.metrics.interviewBehaviorScore = Math.round(weightedScore);
        student.metrics.compositeReadiness = Math.round(
          (student.metrics.atsResumeScore || 80) * 0.4 +
            (student.metrics.leetcodeSolved ? Math.min(100, student.metrics.leetcodeSolved / 3) : 75) * 0.3 +
            student.metrics.interviewBehaviorScore * 0.3
        );
        await student.save();
      }
    }

    res.json({
      success: true,
      message: 'Interview session concluded and saved',
      report: {
        sessionId: session._id,
        status: session.status,
        overallScore,
        weightedScore,
        answeredCount: answers.length,
        totalQuestions: questions.length,
        integrityRating,
        difficultyStats,
        violationsCounted: countedViolations.length,
        violationBreakdown,
        answers: answers.map((a) => ({
          questionId: a.questionId,
          totalScore: a.totalScore,
          conceptMarks: a.scores?.conceptMarks,
          depthMarks: a.scores?.depthMarks,
          clarityMarks: a.scores?.clarityMarks,
          penaltiesDeducted: a.scores?.penaltiesDeducted
        })),
        recommendations
      }
    });
  } catch (err) {
    console.error('[Session Finish Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/modules/interviews/sessions
// @desc    DELETE authenticated user's interview sessions only
router.delete('/sessions', protect, async (req, res) => {
  try {
    const userSessions = await InterviewSession.find({ user: req.user._id }).select('_id').lean();
    const sessionIds = userSessions.map((s) => s._id);

    if (sessionIds.length > 0) {
      await InterviewViolation.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewAnswer.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewSession.deleteMany({ user: req.user._id });
    }

    res.json({
      success: true,
      message: `Deleted ${sessionIds.length} interview session(s) belonging to current user.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 4. BACKWARD COMPATIBILITY WRAPPER (POST /api/modules/interviews/submit)
// =========================================================================

// @route   POST /api/modules/interviews/submit
// @desc    Backward compatible wrapper for legacy submission
router.post('/submit', protect, async (req, res) => {
  try {
    const { questionText, candidateResponse, targetRole, isTerminated, terminationReason, violations } = req.body;

    const student = req.user.student
      ? await Student.findById(req.user.student)
      : await Student.findOne({ email: req.user.email });

    // Find or fallback question
    let question = await InterviewQuestion.findOne({
      text: (questionText || '').trim()
    });

    if (!question) {
      const qs = await selectSessionQuestions(targetRole || 'ai_ml');
      question = qs[0];
    }

    const countedViolations = Array.isArray(violations) ? violations.length : 0;
    const evalResult = await evaluateAnswer(question, candidateResponse, countedViolations, Boolean(isTerminated));

    // Also persist into legacy MockInterview model so older queries stay populated
    const legacyDoc = await MockInterview.create({
      student: student ? student._id : null,
      targetRole: targetRole || 'ai_ml',
      sessionNumber: 1,
      questions: [
        {
          questionText: question.text,
          category: question.topic,
          candidateResponse: candidateResponse || '',
          candidateSpokenTranscript: candidateResponse || '',
          wordCount: evalResult.wordCount,
          conceptRelevancePct: evalResult.conceptRelevancePct,
          aiScore: evalResult.aiScore,
          aiFeedback: evalResult.aiFeedback,
          strengths: evalResult.strengths,
          improvements: evalResult.improvements,
          marksBreakdown: evalResult.marksBreakdown,
          conditionsEvaluated: evalResult.conditionsEvaluated
        }
      ],
      behavioralAnalysis: {
        movementWarningCount: 0,
        obstacleWarningCount: 0,
        unexpectedObjectCount: 0,
        secondPersonCount: 0,
        noiseWarningCount: 0,
        totalWarningsCount: countedViolations
      },
      status: isTerminated ? 'Terminated_Violations' : 'Completed',
      isTerminated: Boolean(isTerminated),
      terminationReason: terminationReason || '',
      totalWarnings: countedViolations,
      violations: violations || [],
      overallInterviewScore: evalResult.aiScore
    });

    res.json({
      success: true,
      message: 'Interview evaluated and persisted successfully',
      evaluation: evalResult,
      data: legacyDoc
    });
  } catch (err) {
    console.error('[Legacy Submit Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
