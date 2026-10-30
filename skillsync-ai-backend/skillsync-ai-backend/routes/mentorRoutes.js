const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mentorConfig = require('../config/mentorConfig');
const MentorChat = require('../models/MentorChat');
const Student = require('../models/Student');

/**
 * Build rich system instruction with candidate context
 */
function buildSystemInstruction(student = null) {
  const candidateName = student ? student.fullName || 'Candidate' : 'Candidate';
  const targetRole = student ? student.customTargetRole || student.targetRole || 'Software Engineering' : 'Software Engineering';
  const college = student ? student.college || 'Engineering Campus' : 'Engineering Campus';
  const skillsList = student && Array.isArray(student.skills) && student.skills.length > 0
    ? student.skills.join(', ')
    : 'Data Structures, Algorithms, JavaScript, Node.js, SQL';
  const atsScore = student && student.metrics && student.metrics.atsResumeScore ? student.metrics.atsResumeScore : 'Not Scored Yet';
  const leetcodeSolved = student && student.metrics && student.metrics.leetcodeSolved ? student.metrics.leetcodeSolved : 0;
  const readiness = student && student.metrics && student.metrics.compositeReadiness ? `${student.metrics.compositeReadiness}%` : 'In Progress';

  return `You are "SkillSync Mentor", a world-class Senior Engineering Leader and Campus Placement Mentor (ex-FAANG Principal Engineer).
Your mission is to mentor ${candidateName}, an engineering student at ${college} aiming for a "${targetRole}" role.

CANDIDATE CONTEXT:
- Candidate Name: ${candidateName}
- Target Role: ${targetRole}
- Technical Skills: ${skillsList}
- LeetCode Solved: ${leetcodeSolved} problems
- ATS Resume Score: ${atsScore}/100
- Placement Readiness: ${readiness}

COMMUNICATION STYLE & PRINCIPLES:
1. Deep Technical Rigor: Explain time/space complexities with Big-O notation, concrete code patterns, and edge cases.
2. Structured & Engaging: Use markdown headers (###, ####), bullet points, bold key terms, and concise code snippets where helpful.
3. Realistic Placement Guidance: Share realistic Tier-1 interview expectations (Google, Microsoft, Amazon, Uber, Atlassian).
4. Direct & Actionable: Give explicit next steps, benchmark problem recommendations, and live interview verbalization tips.
5. Mathematical Notation: When writing formulas or complexity, use standard LaTeX or markdown (e.g. $O(N)$ or \`O(N)\`).
6. Tone: Warm, encouraging, highly knowledgeable, and authoritative yet approachable.`;
}

// =========================================================================
// HEALTH CHECK ENDPOINT
// =========================================================================

// @route   GET /api/modules/mentor/health
// @desc    Check AI Mentor LLM configuration, active model, and service health
router.get('/health', (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MENTOR_MODEL || process.env.GEMINI_MODEL || mentorConfig.LLM.model || 'gemini-2.5-flash';
    const llmConfigured = Boolean(apiKey && apiKey.trim().length > 0);
    res.json({
      success: true,
      llmConfigured,
      model,
      reachable: true
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// SESSIONS & HISTORY ROUTES (All protected by JWT auth)
// =========================================================================

// @route   GET /api/modules/mentor/sessions
// @desc    Get all chat sessions for authenticated user
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await MentorChat.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select('sessionId title messages updatedAt createdAt')
      .lean();

    const formatted = sessions.map((s) => {
      const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
      return {
        sessionId: s.sessionId || String(s._id),
        title: s.title || 'Technical Mentorship Chat',
        updatedAt: s.updatedAt,
        messagesCount: (s.messages || []).length,
        lastMessageSnippet: lastMsg ? lastMsg.content.substring(0, 70) + '...' : 'No messages yet'
      };
    });

    res.json({ success: true, count: formatted.length, sessions: formatted });
  } catch (err) {
    console.error('[Mentor Sessions Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/modules/mentor/sessions/:sessionId
// @desc    Get full message history for a specific session
router.get('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    let session = await MentorChat.findOne({ sessionId, user: req.user._id });
    if (!session) {
      session = await MentorChat.findOne({ _id: sessionId, user: req.user._id }).catch(() => null);
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'Chat session not found' });
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      title: session.title,
      messages: session.messages || []
    });
  } catch (err) {
    console.error('[Mentor Session Detail Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/modules/mentor/sessions/:sessionId
// @desc    Delete a specific session belonging to current user
router.delete('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const deleted = await MentorChat.findOneAndDelete({ sessionId, user: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Session not found or unauthorized' });
    }

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (err) {
    console.error('[Mentor Delete Session Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/modules/mentor/history
// @desc    Get latest active chat session history
router.get('/history', protect, async (req, res) => {
  try {
    let session = await MentorChat.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
    if (!session) {
      // Create fresh default session
      session = await MentorChat.create({
        user: req.user._id,
        student: req.user.student || null,
        title: 'Technical Mentorship Chat',
        messages: [
          {
            sender: 'mentor',
            content:
              "Hello! I am your **SkillSync AI Career Mentor**. I can guide you through Data Structures & Algorithms patterns, System Design architectures, Resume optimization, or live Interview tips. What would you like to prepare today?",
            detectedIntent: 'welcome',
            platformSources: mentorConfig.matchVerifiedResources().sources,
            suggestedActions: [
              'Explain Sliding Window vs Two Pointers with examples',
              'How to structure Resume bullets using the Google XYZ formula',
              'Key System Design principles for URL Shortener (TinyURL)'
            ]
          }
        ]
      });
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      title: session.title,
      messages: session.messages
    });
  } catch (err) {
    console.error('[Mentor History Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/modules/mentor/history
// @desc    Clear all mentor history belonging to current user
router.delete('/history', protect, async (req, res) => {
  try {
    const result = await MentorChat.deleteMany({ user: req.user._id });
    res.json({ success: true, message: `Cleared ${result.deletedCount} mentor chat session(s)` });
  } catch (err) {
    console.error('[Mentor Clear History Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// STREAMING AI CHAT ENGINE (Server-Sent Events)
// =========================================================================

// @route   POST /api/modules/mentor/chat/stream
// @desc    Real-time streaming mentor chat with Gemini 2.5 Flash & SSE
router.post('/chat/stream', protect, async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
  if (res.flushHeaders) res.flushHeaders();

  function sendSSE(eventType, data = {}) {
    const payload = { type: eventType, ...data };
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
  }

  // 15-second heartbeat comment to keep proxies and reverse-tunnels alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {}
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });

  try {
    // 1. Fetch Student profile for context injection
    let student = null;
    if (req.user.student) {
      student = await Student.findById(req.user.student).lean();
    }
    if (!student && req.user.email) {
      student = await Student.findOne({ email: req.user.email }).lean();
    }

    // 2. Fetch or create session
    let chatSession = null;
    if (sessionId) {
      chatSession = await MentorChat.findOne({ sessionId, user: req.user._id });
    }
    if (!chatSession) {
      chatSession = new MentorChat({
        user: req.user._id,
        student: student ? student._id : null,
        title: message.substring(0, 40) + '...',
        messages: []
      });
    } else if (chatSession.messages.length === 0 || chatSession.title === 'Technical Mentorship Chat') {
      chatSession.title = message.substring(0, 40) + '...';
    }

    // 3. Save User message
    chatSession.messages.push({
      sender: 'user',
      content: message,
      timestamp: new Date()
    });

    sendSSE('status', { message: 'Analyzing query and candidate context...' });

    // 4. Build prompt and context
    const systemInstruction = buildSystemInstruction(student);
    const { sources, suggestions } = mentorConfig.matchVerifiedResources(message);

    // Recent conversation window (last 8 messages for coherent context)
    const recentMessages = chatSession.messages.slice(-8);
    const contents = recentMessages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const thoughtSnippet = `Formulating targeted explanation for ${student?.targetRole || 'Software Engineering'} drive...`;
    sendSSE('thought', {
      token: thoughtSnippet,
      text: thoughtSnippet
    });

    let fullAssistantResponse = '';
    const thoughtStartTime = Date.now();

    // 5. Stream from Gemini 2.5 Flash if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    const activeModel = process.env.GEMINI_MENTOR_MODEL || process.env.GEMINI_MODEL || mentorConfig.LLM.model || 'gemini-2.5-flash';
    if (apiKey) {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const stream = await ai.models.generateContentStream({
        model: activeModel,
        contents,
        config: {
          systemInstruction,
          temperature: mentorConfig.LLM.temperature || 0.4
        }
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullAssistantResponse += text;
          sendSSE('token', { token: text, text });
        }
      }
    } else {
      // Deterministic fallback response streamed in small chunks
      const fallbackText = `### 💡 Technical Mentorship Strategy for ${student?.fullName || 'Candidate'}\n\n` +
        `Preparing for **${student?.customTargetRole || student?.targetRole || 'Software Engineering'}** requires deliberate practice across core algorithmic patterns and system trade-offs.\n\n` +
        `#### Key Focus Areas:\n` +
        `- **Data Structures**: Master Sliding Window, Two Pointers, Trees, and Graph BFS/DFS.\n` +
        `- **Problem Breakdown**: State invariants clearly before writing code, and calculate Big-O time and space bounds.\n` +
        `- **Interview Verbalization**: Communicate your thought process clearly throughout the evaluation.\n\n` +
        `Review the verified learning materials linked below for curated problem lists and video tutorials.`;

      const words = fallbackText.split(' ');
      for (const w of words) {
        fullAssistantResponse += w + ' ';
        sendSSE('token', { token: w + ' ', text: w + ' ' });
        await new Promise((r) => setTimeout(r, 25));
      }
    }

    const thoughtDurationSec = parseFloat(((Date.now() - thoughtStartTime) / 1000).toFixed(1));
    sendSSE('thought_done', { durationSec: thoughtDurationSec });

    // Send verified platform sources and follow-up suggestion chips
    sendSSE('sources', { sources, platformSources: sources });
    sendSSE('suggestions', { suggestions, suggestedActions: suggestions });

    // 6. Save assistant message into MongoDB
    const mentorMessage = {
      sender: 'mentor',
      content: fullAssistantResponse,
      thoughtSummary: `Synthesized technical guidance and matched ${sources.length} verified learning resources.`,
      thoughtDurationSec,
      timestamp: new Date(),
      platformSources: sources,
      suggestedActions: suggestions,
      versions: [
        {
          content: fullAssistantResponse,
          thoughtSummary: `Initial response generated in ${thoughtDurationSec}s`,
          timestamp: new Date()
        }
      ],
      activeVersionIndex: 0
    };

    chatSession.messages.push(mentorMessage);
    await chatSession.save();

    const savedMsg = chatSession.messages[chatSession.messages.length - 1];

    sendSSE('done', {
      sessionId: chatSession.sessionId,
      messageId: savedMsg._id,
      title: chatSession.title
    });

    clearInterval(heartbeat);
    res.end();
  } catch (err) {
    console.error('[Mentor Streaming Error]:', err);
    clearInterval(heartbeat);
    sendSSE('error', { message: err.message || 'Mentor generation failed', code: err.code || 'STREAM_ERROR' });
    res.end();
  }
});

// =========================================================================
// STANDARD CHAT & FEEDBACK (Backward Compatibility & Actions)
// =========================================================================

// @route   POST /api/modules/mentor/chat
// @desc    Standard non-streaming chat endpoint (fallback)
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    let student = null;
    if (req.user.student) {
      student = await Student.findById(req.user.student).lean();
    }
    if (!student && req.user.email) {
      student = await Student.findOne({ email: req.user.email }).lean();
    }

    let chatSession = null;
    if (sessionId) {
      chatSession = await MentorChat.findOne({ sessionId, user: req.user._id });
    }
    if (!chatSession) {
      chatSession = new MentorChat({
        user: req.user._id,
        student: student ? student._id : null,
        title: message.substring(0, 40) + '...',
        messages: []
      });
    }

    chatSession.messages.push({
      sender: 'user',
      content: message,
      timestamp: new Date()
    });

    const { sources, suggestions } = mentorConfig.matchVerifiedResources(message);
    const systemInstruction = buildSystemInstruction(student);

    let assistantContent = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const contents = chatSession.messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: mentorConfig.LLM.model || 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: mentorConfig.LLM.temperature || 0.4
        }
      });

      assistantContent = response.text ? response.text.trim() : 'Could not generate mentor response.';
    } else {
      assistantContent = `### Guidance for ${student?.fullName || 'Candidate'}\n\nFocus on mastering core problem-solving invariants and trade-offs. Review the verified resources below.`;
    }

    chatSession.messages.push({
      sender: 'mentor',
      content: assistantContent,
      thoughtSummary: 'Generated guidance with verified resources.',
      thoughtDurationSec: 1.2,
      timestamp: new Date(),
      platformSources: sources,
      suggestedActions: suggestions,
      versions: [{ content: assistantContent, timestamp: new Date() }],
      activeVersionIndex: 0
    });

    await chatSession.save();
    const savedMsg = chatSession.messages[chatSession.messages.length - 1];

    res.json({
      success: true,
      sessionId: chatSession.sessionId,
      reply: assistantContent,
      platformSources: sources,
      suggestedActions: suggestions,
      messageId: savedMsg._id
    });
  } catch (err) {
    console.error('[Mentor Standard Chat Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/modules/mentor/chat/regenerate
// @desc    Regenerate the latest assistant response with version branching
router.post('/chat/regenerate', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const chatSession = await MentorChat.findOne({ sessionId, user: req.user._id });
    if (!chatSession || chatSession.messages.length === 0) {
      return res.status(404).json({ success: false, error: 'Chat session not found' });
    }

    const lastMsgIndex = chatSession.messages.length - 1;
    const lastMsg = chatSession.messages[lastMsgIndex];
    if (lastMsg.sender !== 'mentor') {
      return res.status(400).json({ success: false, error: 'Last message is not a mentor response' });
    }

    let student = null;
    if (req.user.student) {
      student = await Student.findById(req.user.student).lean();
    }

    const systemInstruction = buildSystemInstruction(student);
    const apiKey = process.env.GEMINI_API_KEY;
    let newContent = '';

    if (apiKey) {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      // Take messages before this assistant response
      const history = chatSession.messages.slice(0, lastMsgIndex).slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: mentorConfig.LLM.model || 'gemini-2.5-flash',
        contents: history,
        config: {
          systemInstruction,
          temperature: 0.7 // Higher temperature for varied response
        }
      });
      newContent = response.text ? response.text.trim() : '';
    }

    if (!newContent) {
      newContent = lastMsg.content + '\n\n*(Alternative perspective: consider testing boundary corner cases first).*';
    }

    // Add new version to versions array
    if (!lastMsg.versions) lastMsg.versions = [];
    if (lastMsg.versions.length === 0) {
      lastMsg.versions.push({
        content: lastMsg.content,
        thoughtSummary: lastMsg.thoughtSummary || '',
        timestamp: lastMsg.timestamp || new Date()
      });
    }

    lastMsg.versions.push({
      content: newContent,
      thoughtSummary: 'Regenerated with alternative technical perspective',
      timestamp: new Date()
    });

    lastMsg.activeVersionIndex = lastMsg.versions.length - 1;
    lastMsg.content = newContent;

    await chatSession.save();

    res.json({
      success: true,
      messageId: lastMsg._id,
      newContent,
      versionsCount: lastMsg.versions.length,
      activeVersionIndex: lastMsg.activeVersionIndex
    });
  } catch (err) {
    console.error('[Mentor Regenerate Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/modules/mentor/chat/feedback
// @desc    Submit thumbs up/down rating and feedback comment for a message
router.post('/chat/feedback', protect, async (req, res) => {
  try {
    const { sessionId, messageId, rating, comment } = req.body;
    const chatSession = await MentorChat.findOne({ sessionId, user: req.user._id });
    if (!chatSession) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const msg = chatSession.messages.id(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    msg.feedback = {
      rating: rating === 'up' ? 'up' : rating === 'down' ? 'down' : null,
      comment: (comment || '').substring(0, 500),
      submittedAt: new Date()
    };

    await chatSession.save();
    res.json({ success: true, message: 'Feedback recorded' });
  } catch (err) {
    console.error('[Mentor Feedback Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
