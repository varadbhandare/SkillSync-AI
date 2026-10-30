const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const Student = require('../models/Student');
const { optionalAuth } = require('../middleware/authMiddleware');

// Standard Benchmark Taxonomies per Target Role
const ROLE_TAXONOMIES = {
  ai_ml: [
    'Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Deep Learning',
    'Machine Learning', 'NLP', 'Computer Vision', 'FastAPI', 'SQL',
    'Git', 'Docker', 'Vector Databases', 'Milvus', 'Transformers'
  ],
  fullstack: [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
    'HTML', 'CSS', 'Tailwind', 'REST APIs', 'MongoDB',
    'PostgreSQL', 'Git', 'Docker', 'Next.js', 'Redux'
  ],
  data_scientist: [
    'Python', 'R', 'Pandas', 'NumPy', 'Scikit-Learn',
    'Data Visualization', 'Matplotlib', 'Statistical Modeling', 'SQL',
    'Tableau', 'Power BI', 'Machine Learning', 'BigQuery', 'Data Cleaning'
  ],
  cloud_devops: [
    'Linux', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions',
    'AWS', 'GCP', 'Terraform', 'Ansible', 'Bash',
    'Prometheus', 'Grafana', 'Networking', 'Security'
  ],
  data_engineer: [
    'Python', 'SQL', 'Apache Spark', 'Kafka', 'Hadoop',
    'Airflow', 'BigQuery', 'Snowflake', 'Data Warehousing', 'ETL',
    'Docker', 'PostgreSQL', 'dbt', 'Data Pipelines'
  ]
};

const ACTION_VERBS = [
  'built', 'developed', 'designed', 'implemented', 'optimized',
  'engineered', 'led', 'architected', 'deployed', 'trained',
  'scaled', 'created', 'automated', 'integrated', 'achieved',
  'reduced', 'increased', 'managed', 'configured', 'launched',
  'delivered', 'spearheaded', 'established', 'formulated', 'monitored'
];

// Helper: Extract details and coding platform links from resume text
function extractResumeDetails(rawText) {
  const text = rawText || '';
  
  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const emails = text.match(emailRegex) || [];
  const extractedEmail = emails.length > 0 ? emails[0].toLowerCase() : '';

  // Extract phone
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[\s-]?\d{10}/gi;
  const phones = text.match(phoneRegex) || [];
  const extractedPhone = phones.length > 0 ? phones[0].trim() : '';

  // Extract name candidate from first 3 non-empty lines
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.toLowerCase().startsWith('email') && !l.toLowerCase().startsWith('phone'));
  
  let extractedName = '';
  if (lines.length > 0) {
    const candidateLine = lines[0].replace(/[^a-zA-Z\s]/g, '').trim();
    if (candidateLine.length > 2 && candidateLine.split(/\s+/).length <= 4) {
      extractedName = candidateLine;
    }
  }

  // Extract GitHub URL or handle
  let extractedGithub = '';
  const ghUrlRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-\.]+)/i;
  const ghMatch = text.match(ghUrlRegex);
  const ghIgnore = ['signup', 'login', 'features', 'explore', 'topics', 'trending', 'collections', 'about', 'pricing', 'security'];
  if (ghMatch && ghMatch[1] && !ghIgnore.includes(ghMatch[1].toLowerCase())) {
    extractedGithub = ghMatch[1].replace(/\/+$/, '').trim();
  } else {
    const ghLabelMatch = text.match(/\bgithub\s*[:\-–|]\s*@?([a-zA-Z0-9_\-\.]{2,39})/i);
    if (ghLabelMatch && ghLabelMatch[1] && !ghLabelMatch[1].toLowerCase().includes('http')) {
      extractedGithub = ghLabelMatch[1].trim();
    }
  }

  // Extract LeetCode URL or handle
  let extractedLeetcode = '';
  const lcUrlRegex = /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([a-zA-Z0-9_\-\.]+)/i;
  const lcMatch = text.match(lcUrlRegex);
  const lcIgnore = ['problems', 'explore', 'contest', 'discuss', 'tag', 'company', 'developer', 'subscribe'];
  if (lcMatch && lcMatch[1] && !lcIgnore.includes(lcMatch[1].toLowerCase())) {
    extractedLeetcode = lcMatch[1].replace(/\/+$/, '').trim();
  } else {
    const lcLabelMatch = text.match(/\bleetcode\s*[:\-–|]\s*@?([a-zA-Z0-9_\-\.]{2,39})/i);
    if (lcLabelMatch && lcLabelMatch[1] && !lcLabelMatch[1].toLowerCase().includes('http')) {
      extractedLeetcode = lcLabelMatch[1].trim();
    }
  }

  return { extractedEmail, extractedPhone, extractedName, extractedGithub, extractedLeetcode };
}

// @route   GET /api/resumes/current
// @desc    Get latest parsed resume for the active student
router.get('/current', optionalAuth, async (req, res) => {
  try {
    let student = null;
    if (req.user) {
      if (req.user.student) {
        student = await Student.findById(req.user.student);
      }
      if (!student) {
        student = await Student.findOne({ email: req.user.email });
      }
    }
    if (!student) {
      student = await Student.findOne().sort({ updatedAt: -1 });
    }

    let resume = null;
    if (student) {
      resume = await Resume.findOne({ student: student._id }).sort({ updatedAt: -1 });
    }
    if (!resume) {
      resume = await Resume.findOne().sort({ updatedAt: -1 });
    }

    res.json({ success: true, data: resume });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/resumes/scan
// @desc    Parse resume plaintext, perform dynamic ATS evaluation for ONLY uploaded resume & validate student identity
router.post('/scan', optionalAuth, async (req, res) => {
  try {
    const rawText = req.body.rawText || req.body.resumeText || req.body.text || '';
    const { targetRole = 'ai_ml', customTargetRole = '', fileName = 'resume.pdf' } = req.body;

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is empty. Please provide resume content to evaluate.'
      });
    }

    // 1. Resolve registered student
    let student = null;
    if (req.user) {
      if (req.user.student) {
        student = await Student.findById(req.user.student);
      }
      if (!student) {
        student = await Student.findOne({ email: req.user.email });
      }
    }
    if (!student) {
      student = await Student.findOne().sort({ updatedAt: -1 });
    }
    if (!student) {
      student = await Student.create({
        fullName: req.user ? req.user.name : 'Alex Morgan',
        email: req.user ? req.user.email : 'student@university.edu'
      });
    }

    const effectiveRole = targetRole || student.targetRole || 'ai_ml';
    const effectiveCustomRole = customTargetRole || student.customTargetRole || '';

    // 2. Perform Student Identity Validation against registered profile & Extract Coding URLs
    const { extractedEmail, extractedPhone, extractedName, extractedGithub, extractedLeetcode } = extractResumeDetails(rawText);
    const warnings = [];
    const textLower = rawText.toLowerCase();

    // Automatically update student profile platforms if detected in resume
    let platformsUpdated = false;
    if (!student.platforms) student.platforms = {};
    if (extractedGithub) {
      student.platforms.github = extractedGithub;
      student.github = extractedGithub;
      platformsUpdated = true;
    }
    if (extractedLeetcode) {
      student.platforms.leetcode = extractedLeetcode;
      student.leetcode = extractedLeetcode;
      platformsUpdated = true;
    }
    if (platformsUpdated) {
      await student.save();
    }

    // Check email match
    if (extractedEmail) {
      const studentEmailClean = (student.email || '').toLowerCase().trim();
      if (studentEmailClean && extractedEmail !== studentEmailClean) {
        warnings.push(
          `Email Mismatch: The uploaded resume lists contact email "${extractedEmail}", but your registered student profile email is "${studentEmailClean}".`
        );
      }
    } else {
      warnings.push('Contact Notice: No valid email address was detected in the uploaded resume header.');
    }

    // Check candidate name match
    const studentNameClean = (student.fullName || '').toLowerCase().trim();
    if (studentNameClean) {
      const nameParts = studentNameClean.split(/\s+/).filter(p => p.length > 2);
      const hasAnyNamePart = nameParts.some(part => textLower.includes(part));
      if (!hasAnyNamePart) {
        warnings.push(
          `Candidate Name Mismatch: Registered student name "${student.fullName}" was not detected in this resume.`
        );
      }
    }

    const isMatch = warnings.length === 0;
    const matchScore = Math.max(10, 100 - (warnings.length * 45));

    // 3. Dynamic ATS Evaluation strictly based on uploaded resume text
    const words = rawText.trim().split(/\s+/);
    const wordCount = words.length;

    // Determine target benchmark keywords
    let benchmarkKeywords = ROLE_TAXONOMIES[effectiveRole] || ROLE_TAXONOMIES.ai_ml;
    if (effectiveRole === 'other' && effectiveCustomRole) {
      const customWords = effectiveCustomRole
        .split(/[\s,&/]+/)
        .map(w => w.trim())
        .filter(w => w.length > 2);
      benchmarkKeywords = [
        ...customWords,
        'Git', 'System Design', 'REST APIs', 'Problem Solving', 'Databases', 'Debugging'
      ];
    }

    // Check matched vs missing keywords
    const matchedKeywords = [];
    const missingKeywords = [];

    benchmarkKeywords.forEach(kw => {
      const kwLower = kw.toLowerCase();
      if (textLower.includes(kwLower)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    // Compute Keyword Density Score (0 - 100)
    let keywordDensityScore = Math.round((matchedKeywords.length / benchmarkKeywords.length) * 100);
    keywordDensityScore = Math.min(100, Math.max(10, keywordDensityScore));

    // Compute Action Verb Score
    let matchedActionVerbsCount = 0;
    ACTION_VERBS.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'i');
      if (regex.test(rawText)) {
        matchedActionVerbsCount++;
      }
    });
    // Benchmark 8 verbs for full score
    let actionVerbScore = Math.min(100, Math.round((matchedActionVerbsCount / 8) * 100));
    actionVerbScore = Math.max(15, actionVerbScore);

    // Compute Formatting Score (Section presence & length)
    let formattingScore = 30;
    if (/education/i.test(rawText)) formattingScore += 15;
    if (/skills|technical skills|technologies/i.test(rawText)) formattingScore += 20;
    if (/projects|experience|work/i.test(rawText)) formattingScore += 20;
    if (/certifications|achievements|awards/i.test(rawText)) formattingScore += 15;
    formattingScore = Math.min(100, formattingScore);

    // Overall ATS Composite Score
    let overallScore = Math.round(
      (keywordDensityScore * 0.5) + (actionVerbScore * 0.25) + (formattingScore * 0.25)
    );

    // Short resume penalty
    if (wordCount < 100) {
      overallScore = Math.min(45, overallScore);
      keywordDensityScore = Math.min(40, keywordDensityScore);
    }

    // 4. Extract entities present only in this resume
    const extractedSkills = matchedKeywords;
    const extractedFrameworks = [];
    ['React', 'PyTorch', 'TensorFlow', 'FastAPI', 'Express', 'Spring', 'Django', 'Next.js'].forEach(fw => {
      if (textLower.includes(fw.toLowerCase())) {
        extractedFrameworks.push(fw);
      }
    });

    // 5. Generate tailored AI Suggestions strictly based on missing areas
    const aiSuggestions = [];
    let suggId = 1;

    if (missingKeywords.length > 0) {
      aiSuggestions.push({
        id: suggId++,
        title: `Include Benchmark Keywords (${missingKeywords.slice(0, 2).join(', ')})`,
        category: 'keywords',
        originalText: 'Missing specific technical terms expected by ATS filters.',
        suggestedText: `Integrate hands-on evidence of ${missingKeywords.slice(0, 3).join(', ')} into your project bullet points.`,
        applied: false
      });
    }

    const hasMetrics = /\d+[%xX]|\b\d+\s*(ms|seconds|users|samples|accuracy|reduction|increase|revenue)/i.test(rawText);
    if (!hasMetrics) {
      aiSuggestions.push({
        id: suggId++,
        title: 'Add Quantifiable Impact Metrics',
        category: 'impact',
        originalText: 'Responsibilities described without numerical impact.',
        suggestedText: 'Quantify your accomplishments with measurable outcomes (e.g. "Improved processing speed by 38% on 5,000+ records").',
        applied: false
      });
    }

    if (actionVerbScore < 70) {
      aiSuggestions.push({
        id: suggId++,
        title: 'Strengthen Bullet Action Verbs',
        category: 'impact',
        originalText: 'Passive or repetitive duty descriptions.',
        suggestedText: 'Begin each bullet with high-impact action verbs like Spearheaded, Engineered, Optimized, or Automated.',
        applied: false
      });
    }

    if (!/certifications|achievements/i.test(rawText)) {
      aiSuggestions.push({
        id: suggId++,
        title: 'Add Certifications or Recognitions Section',
        category: 'formatting',
        originalText: 'No dedicated certifications section detected.',
        suggestedText: 'Add an Achievements or Industry Certifications section to reinforce your domain authority.',
        applied: false
      });
    }

    // 6. Save or Update Resume in MongoDB
    const resumeRecord = await Resume.findOneAndUpdate(
      { student: student._id },
      {
        student: student._id,
        fileName,
        rawText,
        wordCount,
        targetRole: effectiveRole,
        entities: {
          skills: extractedSkills,
          frameworks: extractedFrameworks,
          certifications: /certified|certification/i.test(rawText) ? ['Verified Industry Credentials'] : []
        },
        atsEvaluation: {
          overallScore,
          keywordDensityScore,
          actionVerbScore,
          formattingScore,
          matchedKeywords,
          missingKeywords
        },
        studentValidation: {
          isMatch,
          matchScore,
          warnings,
          extractedEmail,
          extractedName,
          extractedPhone,
          extractedGithub,
          extractedLeetcode,
          validatedAt: new Date()
        },
        aiSuggestions,
        lastScannedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Sync score with student metrics
    student.metrics.atsResumeScore = overallScore;
    await student.save();

    res.json({
      success: true,
      message: isMatch
        ? 'Resume evaluated successfully: ATS scores computed for uploaded document'
        : 'Resume evaluated with identity mismatch warning: Details differ from registered profile',
      data: {
        ...resumeRecord.toObject(),
        extractedProfiles: {
          github: extractedGithub,
          leetcode: extractedLeetcode
        }
      }
    });
  } catch (err) {
    console.error('[Resume Scan Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
