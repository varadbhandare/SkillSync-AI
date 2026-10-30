/**
 * SkillSync AI - MongoDB Initialization Script
 * Run with: mongosh skillsync_ai mongo-init.js
 * Or copy-paste into MongoDB Compass MongoSH tab!
 */

db = db.getSiblingDB('skillsync_ai');

print('Initializing SkillSync AI MongoDB Database Collections...');

// 1. Students Collection
db.students.drop();
const studentId = new ObjectId();

db.students.insertOne({
  _id: studentId,
  fullName: 'Alex Morgan',
  email: 'student@university.edu',
  phone: '+91 9876543210',
  location: 'Pune, India',
  bio: 'Final Year student specializing in Artificial Intelligence and Data Science with hands-on experience building neural models, REST APIs, and data structures.',
  college: 'Annasaheb Dange College of Engineering and Technology, Ashta',
  department: 'Department of Artificial Intelligence & Data Science',
  degree: 'B. Tech',
  rollNo: '4005',
  cgpa: '8.85 / 10',
  gradYear: '2026-27',
  guide: 'Prof. S.A. Patil',
  platforms: {
    github: 'alexmorgan-dev',
    leetcode: 'alex_code',
    linkedin: 'linkedin.com/in/alexmorgan',
    kaggle: 'alex_ai',
    portfolio: 'https://alexmorgan.dev'
  },
  targetRole: 'ai_ml',
  metrics: {
    compositeReadiness: 82,
    atsResumeScore: 86,
    leetcodeSolved: 280,
    leetcodeRating: 1680,
    interviewBehaviorScore: 80,
    placementProbability: 89.5
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 2. Resumes Collection
db.resumes.drop();
db.resumes.insertOne({
  student: studentId,
  fileName: 'alex_morgan_resume.pdf',
  fileType: 'pdf',
  rawText: 'ALEX MORGAN\nEmail: student@university.edu | Phone: +91 9876543210\nDepartment of AI & DS, ADCET Ashta (CGPA: 8.85/10)\n\nTECHNICAL SKILLS:\n- Python, C++, SQL, PyTorch, Scikit-Learn, spaCy, FastAPI, Docker, Git',
  wordCount: 240,
  entities: {
    skills: ['Python', 'C++', 'SQL', 'PyTorch', 'FastAPI', 'spaCy', 'Docker'],
    frameworks: ['PyTorch', 'Scikit-Learn', 'Transformers'],
    certifications: ['DeepLearning.AI NLP', 'LeetCode Knight Badge']
  },
  atsEvaluation: {
    overallScore: 86,
    keywordDensityScore: 88,
    actionVerbScore: 82,
    formattingScore: 94,
    matchedKeywords: ['Python', 'PyTorch', 'Scikit-Learn', 'NLP (spaCy)', 'FastAPI', 'SQL', 'Git'],
    missingKeywords: ['Vector Databases (Milvus/Pinecone)', 'Docker Containerization', 'MLflow MLOps']
  },
  aiSuggestions: [
    {
      id: 1,
      title: 'Quantifiable Metrics in ML Projects',
      category: 'impact',
      originalText: 'Built classification model',
      suggestedText: 'Trained Vision Transformer on 5,800+ samples achieving 96.2% F1-score with 45% lower latency',
      applied: false
    }
  ],
  targetRole: 'ai_ml',
  lastScannedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

// 3. Coding Profiles Collection
db.codingprofiles.drop();
db.codingprofiles.insertOne({
  student: studentId,
  github: {
    username: 'alexmorgan-dev',
    publicReposCount: 16,
    totalStars: 42,
    contributionsLastYear: 380,
    currentStreakDays: 24,
    healthScore: 90,
    languageBreakdown: [
      { language: 'Python', percentage: 55, color: '#4F46E5' },
      { language: 'JavaScript', percentage: 25, color: '#F59E0B' },
      { language: 'C++', percentage: 15, color: '#10B981' },
      { language: 'Other', percentage: 5, color: '#94A3B8' }
    ],
    featuredRepositories: [
      {
        name: 'skillsync-ai-core',
        description: 'Intelligent Career Readiness Platform Backend',
        language: 'Python',
        stars: 24,
        readmeQualityGrade: 'A',
        url: 'https://github.com/alexmorgan-dev/skillsync-ai-core'
      }
    ]
  },
  leetcode: {
    username: 'alex_code',
    totalSolved: 280,
    easySolved: 140,
    mediumSolved: 115,
    hardSolved: 25,
    contestRating: 1680,
    globalRankingPercentage: 15,
    badgeName: 'Knight',
    topicMastery: [
      { topic: 'Arrays & Two Pointers', percentage: 90, solvedCount: 80 },
      { topic: 'Trees & BST', percentage: 80, solvedCount: 50 },
      { topic: 'Graphs & BFS/DFS', percentage: 70, solvedCount: 40 },
      { topic: 'Dynamic Programming', percentage: 65, solvedCount: 30 }
    ]
  },
  lastSyncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

// 4. Placement Readiness Collection
db.placementreadinesses.drop();
db.placementreadinesses.insertOne({
  student: studentId,
  compositeScore: 82.0,
  grade: 'A',
  percentileRank: 'Top 15%',
  weightsBreakdown: {
    resumeScore: { score: 86, weight: 0.30 },
    leetcodeScore: { score: 80, weight: 0.25 },
    githubScore: { score: 90, weight: 0.20 },
    mockInterviewScore: { score: 80, weight: 0.25 }
  },
  competency360: [
    { dimension: 'DSA & Algorithms', candidateScore: 84, benchmarkScore: 80 },
    { dimension: 'AI / Core Tech', candidateScore: 92, benchmarkScore: 85 },
    { dimension: 'System Design', candidateScore: 70, benchmarkScore: 75 },
    { dimension: 'APIs & Backend', candidateScore: 86, benchmarkScore: 80 },
    { dimension: 'Code Quality', candidateScore: 90, benchmarkScore: 80 },
    { dimension: 'Communication', candidateScore: 80, benchmarkScore: 75 }
  ],
  predictionModel: {
    algorithm: 'XGBoost v2.4 Multi-Class',
    overallProbability: 89.5,
    tier1ProductChance: 88,
    aiSpecializedChance: 92,
    itServicesChance: 95,
    estimatedCtcBracket: '8.5 LPA - 18.0 LPA'
  },
  growthHistory: [
    { weekLabel: 'Week 1', score: 60, recordedAt: new Date() },
    { weekLabel: 'Week 3', score: 72, recordedAt: new Date() },
    { weekLabel: 'Week 6 (Now)', score: 82, recordedAt: new Date() }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Successfully initialized and populated skillsync_ai MongoDB Database!');
