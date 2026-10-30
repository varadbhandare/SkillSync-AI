const express = require('express');
const router = express.Router();
const CodingProfile = require('../models/CodingProfile');
const Student = require('../models/Student');
const { optionalAuth } = require('../middleware/authMiddleware');

const LANGUAGE_COLORS = {
  Python: '#4F46E5',
  JavaScript: '#F59E0B',
  TypeScript: '#3178C6',
  'C++': '#10B981',
  C: '#555555',
  Java: '#B07219',
  HTML: '#E34F26',
  CSS: '#563D7C',
  Go: '#00ADD8',
  Rust: '#DEA584',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Shell: '#89E051',
  Other: '#94A3B8'
};

// Helper to extract GitHub username from full URL or handle
function extractGithubUsername(input) {
  if (!input) return '';
  let str = input.trim();
  str = str.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const match = str.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-\.]+)/i);
  if (match) return match[1];
  return str.replace(/^@/, '').replace(/[^a-zA-Z0-9_\-\.]/g, '').trim();
}

// Helper to extract LeetCode username from full URL or handle
function extractLeetcodeUsername(input) {
  if (!input) return '';
  let str = input.trim();
  str = str.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const match = str.match(/(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([a-zA-Z0-9_\-\.]+)/i);
  if (match) return match[1];
  return str.replace(/^@/, '').replace(/[^a-zA-Z0-9_\-\.]/g, '').trim();
}

// Helper to fetch live GitHub metrics
async function fetchLiveGitHub(username) {
  const cleanUser = extractGithubUsername(username);
  if (!cleanUser) {
    return { isConnected: false, data: null };
  }

  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`, {
      headers: {
        'User-Agent': 'SkillSyncAI-CareerReadinessEngine',
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (userRes.status === 404) {
      return {
        isConnected: false,
        data: { username: cleanUser, error: `GitHub user '${cleanUser}' not found` }
      };
    }

    if (!userRes.ok) {
      return {
        isConnected: false,
        data: { username: cleanUser, error: `GitHub API error: ${userRes.statusText}` }
      };
    }

    const userData = await userRes.json();

    // Fetch user's public repositories
    let repos = [];
    try {
      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=30&sort=pushed`,
        {
          headers: {
            'User-Agent': 'SkillSyncAI-CareerReadinessEngine',
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      if (reposRes.ok) {
        repos = await reposRes.json();
      }
    } catch (e) {
      repos = [];
    }

    // Compute star count and language distribution
    let totalStars = 0;
    const langCounts = {};
    let totalLangRepos = 0;

    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        totalLangRepos++;
      }
    });

    const languageBreakdown = Object.keys(langCounts).map(lang => {
      const count = langCounts[lang];
      const percentage = totalLangRepos > 0 ? Math.round((count / totalLangRepos) * 100) : 0;
      return {
        language: lang,
        count,
        percentage,
        color: LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.Other
      };
    }).sort((a, b) => b.percentage - a.percentage);

    // Featured repositories (top 4 by stars and update)
    const featuredRepositories = repos.slice(0, 4).map(repo => ({
      name: repo.name,
      description: repo.description || 'Public GitHub project repository',
      language: repo.language || 'Code',
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      url: repo.html_url
    }));

    // Calculate repository health score (0 - 100) based on activity and public projects
    const repoPoints = Math.min(40, (userData.public_repos || 0) * 4);
    const starPoints = Math.min(30, totalStars * 3);
    const bioPoints = userData.bio ? 10 : 0;
    const activityPoints = repos.length > 0 ? 20 : 0;
    const healthScore = Math.min(100, Math.max(10, repoPoints + starPoints + bioPoints + activityPoints));

    return {
      isConnected: true,
      data: {
        username: cleanUser,
        name: userData.name || cleanUser,
        avatarUrl: userData.avatar_url || '',
        bio: userData.bio || '',
        publicReposCount: userData.public_repos || 0,
        totalStars,
        followers: userData.followers || 0,
        following: userData.following || 0,
        healthScore,
        languageBreakdown,
        featuredRepositories,
        lastFetchedAt: new Date(),
        error: null
      }
    };
  } catch (err) {
    return {
      isConnected: false,
      data: { username: cleanUser, error: err.message }
    };
  }
}

// Helper to fetch live LeetCode metrics
async function fetchLiveLeetCode(username) {
  const cleanUser = extractLeetcodeUsername(username);
  if (!cleanUser) {
    return { isConnected: false, data: null };
  }

  // Try 1: Direct Official LeetCode GraphQL API
  try {
    const gqlRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
                totalSubmissionNum {
                  difficulty
                  count
                }
              }
              profile {
                ranking
                reputation
              }
            }
          }
        `,
        variables: { username: cleanUser }
      })
    });

    if (gqlRes.ok) {
      const gqlData = await gqlRes.json();
      const user = gqlData?.data?.matchedUser;
      if (user) {
        const acStats = user.submitStatsGlobal?.acSubmissionNum || [];
        const totalStats = user.submitStatsGlobal?.totalSubmissionNum || [];
        const easy = acStats.find(s => s.difficulty === 'Easy')?.count || 0;
        const medium = acStats.find(s => s.difficulty === 'Medium')?.count || 0;
        const hard = acStats.find(s => s.difficulty === 'Hard')?.count || 0;
        const all = acStats.find(s => s.difficulty === 'All')?.count || (easy + medium + hard);

        const totalSubs = totalStats.find(s => s.difficulty === 'All')?.count || 0;
        const acceptanceRate = totalSubs > 0 ? parseFloat(((all / totalSubs) * 100).toFixed(1)) : 0;

        return {
          isConnected: true,
          data: {
            username: cleanUser,
            totalSolved: all,
            easySolved: easy,
            mediumSolved: medium,
            hardSolved: hard,
            ranking: user.profile?.ranking || 0,
            reputation: user.profile?.reputation || 0,
            acceptanceRate,
            lastFetchedAt: new Date(),
            error: null
          }
        };
      }
    }
  } catch (err) {
    // Continue to proxy fallback
  }

  // Try 2: Open LeetCode stats API proxy fallback
  try {
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(cleanUser)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          isConnected: true,
          data: {
            username: cleanUser,
            totalSolved: data.totalSolved || 0,
            easySolved: data.easySolved || 0,
            mediumSolved: data.mediumSolved || 0,
            hardSolved: data.hardSolved || 0,
            ranking: data.ranking || 0,
            reputation: data.reputation || 0,
            acceptanceRate: data.acceptanceRate || 0,
            lastFetchedAt: new Date(),
            error: null
          }
        };
      }
    }
  } catch (e) {
    // Try 3
  }

  // Try 3: Alfa LeetCode API fallback
  try {
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(cleanUser)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.totalSolved !== undefined) {
        return {
          isConnected: true,
          data: {
            username: cleanUser,
            totalSolved: data.totalSolved || 0,
            easySolved: data.easySolved || 0,
            mediumSolved: data.mediumSolved || 0,
            hardSolved: data.hardSolved || 0,
            ranking: data.ranking || 0,
            reputation: data.reputation || 0,
            acceptanceRate: data.acceptanceRate || 0,
            lastFetchedAt: new Date(),
            error: null
          }
        };
      }
    }
  } catch (e) {}

  return {
    isConnected: false,
    data: {
      username: cleanUser,
      error: `Could not retrieve live LeetCode statistics for username '${cleanUser}'. Verify handle exists on leetcode.com.`
    }
  };
}

// Overall Multi-Platform Coding Performance Analysis Function
function analyzeOverallCodingPerformance(github, leetcode, targetRole = 'ai_ml') {
  const isGhConnected = Boolean(github && github.username && (github.publicReposCount > 0 || github.totalStars > 0 || github.followers > 0));
  const isLcConnected = Boolean(leetcode && leetcode.username && (leetcode.totalSolved > 0 || leetcode.ranking > 0));

  // 1. DSA Score Calculation (0 - 100)
  let dsaScore = 0;
  if (isLcConnected) {
    const easy = leetcode.easySolved || 0;
    const med = leetcode.mediumSolved || 0;
    const hard = leetcode.hardSolved || 0;
    const total = leetcode.totalSolved || (easy + med + hard);

    if (total === 0) {
      dsaScore = 0;
    } else {
      // Weighted problem score: Easy (0.2), Medium (0.75), Hard (2.0)
      const problemPoints = Math.min(80, (easy * 0.2) + (med * 0.75) + (hard * 2.0));
      
      // Volume & ranking bonus
      let rankBonus = 0;
      if (leetcode.ranking && leetcode.ranking > 0) {
        if (leetcode.ranking <= 10000) rankBonus = 15;
        else if (leetcode.ranking <= 50000) rankBonus = 12;
        else if (leetcode.ranking <= 150000) rankBonus = 9;
        else if (leetcode.ranking <= 500000) rankBonus = 5;
        else rankBonus = 2;
      } else if (total >= 100) {
        rankBonus = 10;
      } else if (total >= 50) {
        rankBonus = 5;
      }

      // Acceptance rate bonus
      let accBonus = 0;
      if (leetcode.acceptanceRate && leetcode.acceptanceRate >= 40) {
        accBonus = Math.min(5, Math.round(leetcode.acceptanceRate / 20));
      }

      dsaScore = Math.min(100, Math.max(5, Math.round(problemPoints + rankBonus + accBonus)));
    }
  }

  // 2. Project & Repository Health Score (0 - 100)
  let projectScore = 0;
  if (isGhConnected) {
    const repos = github.publicReposCount || 0;
    const stars = github.totalStars || 0;
    const followers = github.followers || 0;
    const langs = (github.languageBreakdown || []).length;

    const repoPts = Math.min(35, repos * 4);
    const starPts = Math.min(30, stars * 4);
    const followerPts = Math.min(15, followers * 2);
    const langPts = Math.min(10, langs * 3);
    const featuredPts = (github.featuredRepositories && github.featuredRepositories.length > 0) ? 10 : 0;

    projectScore = Math.min(100, Math.max(15, repoPts + starPts + followerPts + langPts + featuredPts));
  }

  // 3. Composite Mastery Score (0 - 100)
  let compositeScore = 0;
  if (isGhConnected && isLcConnected) {
    compositeScore = Math.round((dsaScore * 0.5) + (projectScore * 0.5));
  } else if (isLcConnected) {
    compositeScore = Math.round(dsaScore * 0.85);
  } else if (isGhConnected) {
    compositeScore = Math.round(projectScore * 0.85);
  } else {
    compositeScore = 0;
  }

  // 4. Candidate Readiness Tier
  let tier = 'Profiles Unlinked';
  if (compositeScore >= 85) {
    tier = 'Tier-1 Placement Ready (Elite Candidate)';
  } else if (compositeScore >= 70) {
    tier = 'Strong Placement Contender (Advanced)';
  } else if (compositeScore >= 50) {
    tier = 'Intermediate Competency (Actively Progressing)';
  } else if (compositeScore > 0) {
    tier = 'Foundational Developer (Early Stage)';
  }

  // 5. Strengths Identification
  const strengths = [];
  if (isLcConnected) {
    if ((leetcode.totalSolved || 0) >= 150) {
      strengths.push(`High DSA volume with ${leetcode.totalSolved} total solved problems on LeetCode`);
    } else if ((leetcode.totalSolved || 0) >= 50) {
      strengths.push(`Consistent problem-solving track record on LeetCode (${leetcode.totalSolved} solved)`);
    }
    if ((leetcode.mediumSolved || 0) >= 30) {
      strengths.push(`Proven medium-tier algorithmic fluency (${leetcode.mediumSolved} Medium problems solved)`);
    }
    if ((leetcode.hardSolved || 0) >= 5) {
      strengths.push(`Demonstrated hard-tier problem solving capability (${leetcode.hardSolved} Hard problems solved)`);
    }
  }

  if (isGhConnected) {
    if ((github.publicReposCount || 0) >= 10) {
      strengths.push(`Prolific public repository portfolio (${github.publicReposCount} repositories)`);
    } else if ((github.publicReposCount || 0) >= 4) {
      strengths.push(`Established GitHub codebase with modular project repositories`);
    }
    if ((github.totalStars || 0) >= 10) {
      strengths.push(`Recognized open-source contribution with ${github.totalStars} total stars`);
    }
    const langs = (github.languageBreakdown || []).map(l => l.language || l.name).filter(Boolean);
    if (langs.length >= 2) {
      strengths.push(`Polyglot language fluency across: ${langs.slice(0, 3).join(', ')}`);
    }
  }

  if (strengths.length === 0 && (isGhConnected || isLcConnected)) {
    strengths.push('Active developer telemetry connected with live activity tracking');
  }

  // 6. Actionable Improvements & Placement Advice
  const improvements = [];
  if (!isLcConnected) {
    improvements.push('Link LeetCode username in Student Profile to benchmark DSA speed against interview standards');
  } else {
    if ((leetcode.mediumSolved || 0) < 40) {
      improvements.push('Target 40+ Medium LeetCode problems in Trees, Graphs, and Dynamic Programming');
    }
    if ((leetcode.hardSolved || 0) < 5) {
      improvements.push('Attempt 5+ Hard problems to pass advanced rounds at Tier-1 companies');
    }
  }

  if (!isGhConnected) {
    improvements.push('Link GitHub username in Student Profile to demonstrate practical project engineering and code quality');
  } else {
    if ((github.publicReposCount || 0) < 5) {
      improvements.push('Publish 2 additional flagship repositories with live deployment links');
    }
    if ((github.totalStars || 0) < 5) {
      improvements.push('Enhance README documentation with architecture diagrams to boost project traction');
    }
  }

  if (improvements.length === 0) {
    improvements.push('Maintain daily commit cadence and participate in weekly LeetCode contests');
  }

  // 7. Executive Placement Synthesis Summary
  let summary = '';
  if (isGhConnected && isLcConnected) {
    summary = `Candidate displays a well-balanced profile with ${dsaScore}% DSA proficiency (LeetCode: ${leetcode.totalSolved} solved) and ${projectScore}% practical engineering stature (GitHub: ${github.publicReposCount} repos, ${github.totalStars} stars). Overall placement index stands at ${compositeScore}%, positioning candidate in the ${tier}.`;
  } else if (isLcConnected) {
    summary = `Candidate shows strong algorithmic capability (${leetcode.totalSolved} LeetCode problems solved, DSA index ${dsaScore}%). However, GitHub portfolio is unlinked, leaving project implementation capabilities unverified. Link GitHub to reach maximum readiness index.`;
  } else if (isGhConnected) {
    summary = `Candidate demonstrates practical project implementation (${github.publicReposCount} repositories, ${github.totalStars} stars, project index ${projectScore}%). However, LeetCode profile is unlinked. Link LeetCode to verify problem-solving and algorithmic speed.`;
  } else {
    summary = 'No live coding profiles are linked yet. Enter your GitHub and LeetCode handles in Student Profile to generate full multi-platform performance telemetry.';
  }

  // 8. 5-Axis Radar Breakdown
  const radarBreakdown = {
    dsa: dsaScore,
    projects: projectScore,
    languages: Math.min(100, ((github?.languageBreakdown || []).length * 25) || (isLcConnected ? 60 : 0)),
    consistency: Math.min(100, Math.round(((dsaScore * 0.6) + (projectScore * 0.4)))),
    openSource: Math.min(100, Math.min(100, ((github?.totalStars || 0) * 8) + ((github?.followers || 0) * 5)) || 0)
  };

  return {
    compositeScore,
    tier,
    dsaScore,
    projectScore,
    strengths,
    improvements,
    summary,
    radarBreakdown
  };
}

// Helper to normalize and format coding profile payload for frontend & Postman
function formatCodingResponse(profile, student) {
  const ghConnected = Boolean(profile && profile.isGithubConnected && profile.github?.username);
  const lcConnected = Boolean(profile && profile.isLeetcodeConnected && profile.leetcode?.username);
  const perf = profile?.overallPerformance || analyzeOverallCodingPerformance(profile?.github, profile?.leetcode, student?.targetRole);

  return {
    _id: profile?._id,
    student: profile?.student,
    isGithubConnected: ghConnected,
    isLeetcodeConnected: lcConnected,
    github: {
      username: ghConnected ? profile.github.username : '',
      connected: ghConnected,
      publicRepos: ghConnected ? (profile.github.publicReposCount || profile.github.publicRepos || 0) : 0,
      publicReposCount: ghConnected ? (profile.github.publicReposCount || profile.github.publicRepos || 0) : 0,
      totalStars: ghConnected ? (profile.github.totalStars || 0) : 0,
      followers: ghConnected ? (profile.github.followers || 0) : 0,
      portfolioHealthScore: ghConnected ? (profile.github.healthScore || 85) : 0,
      healthScore: ghConnected ? (profile.github.healthScore || 85) : 0,
      languages: ghConnected ? (profile.github.languageBreakdown || profile.github.languages || []).map(l => ({
        name: l.language || l.name,
        percentage: l.percentage,
        count: l.count,
        color: l.color
      })) : [],
      languageBreakdown: ghConnected ? (profile.github.languageBreakdown || profile.github.languages || []) : [],
      featuredRepos: ghConnected ? (profile.github.featuredRepositories || profile.github.featuredRepos || []) : [],
      featuredRepositories: ghConnected ? (profile.github.featuredRepositories || profile.github.featuredRepos || []) : []
    },
    leetcode: {
      username: lcConnected ? profile.leetcode.username : '',
      connected: lcConnected,
      totalSolved: lcConnected ? (profile.leetcode.totalSolved || 0) : 0,
      easySolved: lcConnected ? (profile.leetcode.easySolved || 0) : 0,
      mediumSolved: lcConnected ? (profile.leetcode.mediumSolved || 0) : 0,
      hardSolved: lcConnected ? (profile.leetcode.hardSolved || 0) : 0,
      ranking: lcConnected ? (profile.leetcode.ranking || 0) : 0,
      acceptanceRate: lcConnected ? (profile.leetcode.acceptanceRate || 0) : 0
    },
    overallPerformance: perf
  };
}

// @route   GET /api/coding-profiles
// @desc    Get current coding profile data connected only to registered student
router.get('/', optionalAuth, async (req, res) => {
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

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // Handles saved in student's profile
    const studentGh = (student?.platforms?.github || student?.github || '').trim();
    const studentLc = (student?.platforms?.leetcode || student?.leetcode || '').trim();

    let profile = await CodingProfile.findOne({ student: student._id });

    // If student has handles but no profile exists yet, or handles changed, sync live for only that student!
    const needsSync = Boolean(
      (studentGh && (!profile || !profile.isGithubConnected || profile.github?.username !== studentGh)) ||
      (studentLc && (!profile || !profile.isLeetcodeConnected || profile.leetcode?.username !== studentLc))
    );

    if (needsSync) {
      const ghResult = await fetchLiveGitHub(studentGh);
      const lcResult = await fetchLiveLeetCode(studentLc);
      const overallPerformance = analyzeOverallCodingPerformance(ghResult.data, lcResult.data, student.targetRole);

      profile = await CodingProfile.findOneAndUpdate(
        { student: student._id },
        {
          student: student._id,
          isGithubConnected: ghResult.isConnected,
          github: ghResult.data || { username: studentGh },
          isLeetcodeConnected: lcResult.isConnected,
          leetcode: lcResult.data || { username: studentLc },
          overallPerformance,
          lastSyncedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } else if (profile && !profile.overallPerformance) {
      profile.overallPerformance = analyzeOverallCodingPerformance(profile.github, profile.leetcode, student.targetRole);
      await profile.save();
    }

    res.json({ success: true, data: formatCodingResponse(profile, student) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/coding-profiles/sync
// @desc    Synchronize GitHub & LeetCode metrics strictly for the student's profile handles
router.post('/sync', optionalAuth, async (req, res) => {
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

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // If handles/URLs are passed in request, sanitize and update student's profile data
    const rawGh = req.body.github !== undefined ? req.body.github : (req.body.githubUrl !== undefined ? req.body.githubUrl : req.body.platforms?.github);
    const rawLc = req.body.leetcode !== undefined ? req.body.leetcode : (req.body.leetcodeUrl !== undefined ? req.body.leetcodeUrl : req.body.platforms?.leetcode);

    if (rawGh !== undefined) {
      if (!student.platforms) student.platforms = {};
      const cleanGh = extractGithubUsername(rawGh);
      student.platforms.github = cleanGh;
      student.github = cleanGh;
    }
    if (rawLc !== undefined) {
      if (!student.platforms) student.platforms = {};
      const cleanLc = extractLeetcodeUsername(rawLc);
      student.platforms.leetcode = cleanLc;
      student.leetcode = cleanLc;
    }
    await student.save();

    // Fetch strictly using the student's profile handles
    const ghUser = (student.platforms?.github || student.github || '').trim();
    const lcUser = (student.platforms?.leetcode || student.leetcode || '').trim();

    // 1. Fetch GitHub Live
    const ghResult = await fetchLiveGitHub(ghUser);

    // 2. Fetch LeetCode Live
    const lcResult = await fetchLiveLeetCode(lcUser);

    // 3. Compute Comprehensive Overall Performance Analysis
    const overallPerformance = analyzeOverallCodingPerformance(ghResult.data, lcResult.data, student.targetRole);

    const updateDoc = {
      student: student._id,
      isGithubConnected: ghResult.isConnected,
      github: ghResult.data || {
        username: ghUser,
        publicReposCount: 0,
        totalStars: 0,
        followers: 0,
        following: 0,
        healthScore: 0,
        languageBreakdown: [],
        featuredRepositories: [],
        error: ghUser ? `Could not connect to GitHub handle: ${ghUser}` : null
      },
      isLeetcodeConnected: lcResult.isConnected,
      leetcode: lcResult.data || {
        username: lcUser,
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        ranking: 0,
        reputation: 0,
        acceptanceRate: 0,
        error: lcUser ? `Could not connect to LeetCode handle: ${lcUser}` : null
      },
      overallPerformance,
      lastSyncedAt: new Date()
    };

    const updatedProfile = await CodingProfile.findOneAndUpdate(
      { student: student._id },
      updateDoc,
      { upsert: true, new: true }
    );

    // Update student's solved count if live LeetCode was retrieved
    if (lcResult.isConnected && lcResult.data?.totalSolved) {
      student.metrics.leetcodeSolved = lcResult.data.totalSolved;
      await student.save();
    }

    res.json({
      success: true,
      message: 'GitHub & LeetCode profiles tracked and synchronized in MongoDB for student profile',
      data: formatCodingResponse(updatedProfile, student),
      studentPlatforms: student.platforms
    });
  } catch (err) {
    console.error('[Coding Profile Sync Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
