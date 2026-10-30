/**
 * SkillSync AI - AI Career Mentor Configuration & Verified Resource Knowledgebase
 * 14 Categories with Evergreen Documentation Roots, Authoritative Standards, and Dynamic Search Queries
 */

const https = require('https');
const http = require('http');

// In-memory link health cache with 24-hour TTL
const linkCache = new Map();

const mentorConfig = {
  LLM: {
    model: process.env.GEMINI_MENTOR_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: 0.4,
    timeoutMs: 35000,
    maxOutputTokens: 2048
  },

  // In-memory cached link health checker with 24-hour TTL
  async checkUrlHealth(url, timeoutMs = 5000) {
    const cached = linkCache.get(url);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.healthy;
    }
    try {
      const client = url.startsWith('https:') ? https : http;
      const healthy = await new Promise((resolve) => {
        const req = client.request(url, { method: 'HEAD', timeout: timeoutMs }, (res) => {
          // Status 2xx, 3xx or 403 (for bot-filtering sites like LeetCode) indicates endpoint exists
          resolve((res.statusCode >= 200 && res.statusCode < 400) || res.statusCode === 403);
        });
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        req.on('error', () => {
          resolve(false);
        });
        req.end();
      });
      linkCache.set(url, { healthy, expiresAt: now + 24 * 60 * 60 * 1000 });
      return healthy;
    } catch (e) {
      linkCache.set(url, { healthy: false, expiresAt: now + 24 * 60 * 60 * 1000 });
      return false;
    }
  },

  // 14 Core Verified Technical & Placement Categories
  VERIFIED_RESOURCES: [
    // 1. Sliding Window & Two Pointers
    {
      keywords: ['sliding window', 'two pointer', 'two pointers', 'subarray', 'substring'],
      intent: 'dsa_sliding_window',
      sources: [
        {
          title: 'Sliding Window & Two Pointer Patterns',
          provider: 'YouTube',
          channel: 'NeetCode',
          concept: 'Dynamic window expansion, shrink conditions, and auxiliary hash map tracking',
          badge: '🎬 Video Tutorial',
          url: 'https://www.youtube.com/results?search_query=sliding+window+technique+neetcode',
          category: 'youtube',
          icon: 'fa-brands fa-youtube text-rose-500'
        },
        {
          title: 'LeetCode Curated Sliding Window Problems',
          provider: 'LeetCode',
          channel: 'LeetCode Practice',
          concept: 'Problems featuring contiguous subarrays and strings',
          badge: '💻 Practice Problems',
          url: 'https://leetcode.com/problemset/all/?topicSlugs=sliding-window',
          category: 'coding_platform',
          icon: 'fa-solid fa-code text-amber-500'
        },
        {
          title: 'NeetCode 150 - Sliding Window Track',
          provider: 'NeetCode.io',
          channel: 'NeetCode Official',
          concept: 'Structured progression from Best Time to Buy Stock to Minimum Window Substring',
          badge: '🗺️ Curated Roadmap',
          url: 'https://neetcode.io/practice',
          category: 'learning_material',
          icon: 'fa-solid fa-layer-group text-indigo-500'
        }
      ],
      suggestions: [
        'Solve LeetCode #3 (Longest Substring Without Repeating Characters)',
        'Implement Minimum Window Substring with character frequency map',
        'Review NeetCode 150 Sliding Window tutorial'
      ]
    },

    // 2. Binary Search & Monotonic Conditions
    {
      keywords: ['binary search', 'answer space', 'monotonic', 'koko', 'rotated array', 'bisect'],
      intent: 'dsa_binary_search',
      sources: [
        {
          title: 'Binary Search on Answer Space Masterclass',
          provider: 'YouTube',
          channel: 'Striver (takeUforward)',
          concept: 'Monotonic predicate functions, boundary conditions, and search space reduction',
          badge: '🎬 Video Masterclass',
          url: 'https://www.youtube.com/results?search_query=binary+search+on+answers+striver',
          category: 'youtube',
          icon: 'fa-brands fa-youtube text-rose-500'
        },
        {
          title: 'LeetCode Curated Binary Search Problems',
          provider: 'LeetCode',
          channel: 'LeetCode Practice',
          concept: 'Problems on sorted arrays, search matrices, and monotonic feasibility',
          badge: '💻 Benchmark Problems',
          url: 'https://leetcode.com/problemset/all/?topicSlugs=binary-search',
          category: 'coding_platform',
          icon: 'fa-solid fa-code text-amber-500'
        },
        {
          title: 'NeetCode 150 Binary Search Section',
          provider: 'NeetCode.io',
          channel: 'NeetCode Official',
          concept: 'Rotated sorted arrays, 2D matrix search, and time-based key-value stores',
          badge: '🗺️ Practice Track',
          url: 'https://neetcode.io/practice',
          category: 'learning_material',
          icon: 'fa-solid fa-book-bookmark text-emerald-500'
        }
      ],
      suggestions: [
        'Practice LeetCode 875 (Koko Eating Bananas)',
        'Write monotonic check function for ship package capacity',
        'Analyze boundary condition low <= high vs low < high'
      ]
    },

    // 3. Binary Trees & BST
    {
      keywords: ['tree', 'binary tree', 'bst', 'lca', 'traversal', 'inorder', 'lowest common ancestor', 'trie'],
      intent: 'dsa_trees',
      sources: [
        {
          title: 'Binary Tree Traversal & Recursion Patterns',
          provider: 'YouTube',
          channel: 'NeetCode',
          concept: 'Recursive DFS vs iterative BFS stack/queue implementations',
          badge: '🎬 Video Tutorial',
          url: 'https://www.youtube.com/results?search_query=binary+tree+traversal+neetcode',
          category: 'youtube',
          icon: 'fa-brands fa-youtube text-rose-500'
        },
        {
          title: 'LeetCode Curated Tree Problems',
          provider: 'LeetCode',
          channel: 'LeetCode Practice',
          concept: 'Tree invert, maximum path sum, serialize/deserialize, and LCA',
          badge: '💻 Core Problems',
          url: 'https://leetcode.com/problemset/all/?topicSlugs=tree',
          category: 'coding_platform',
          icon: 'fa-solid fa-code text-amber-500'
        },
        {
          title: 'Roadmap.sh Computer Science Data Structures Guide',
          provider: 'Roadmap.sh',
          channel: 'Community Guide',
          concept: 'Tree invariants, balanced AVL/Red-Black trees, and complexity bounds',
          badge: '🗺️ CS Curriculum',
          url: 'https://roadmap.sh/computer-science',
          category: 'learning_material',
          icon: 'fa-solid fa-layer-group text-indigo-500'
        }
      ],
      suggestions: [
        'Solve Lowest Common Ancestor on LeetCode #236',
        'Implement Level-Order BFS traversal using a Queue',
        'Prove time complexity of tree recursion'
      ]
    },

    // 4. Graph Algorithms & Traversals
    {
      keywords: ['graph', 'bfs', 'dfs', 'dijkstra', 'topological sort', 'cycle', 'bipartite', 'union find'],
      intent: 'dsa_graphs',
      sources: [
        {
          title: 'Graph Algorithms for Technical Interviews',
          provider: 'YouTube',
          channel: 'William Fiset / freeCodeCamp',
          concept: 'Adjacency lists, BFS shortest path, DFS connected components, Topological Sort',
          badge: '🎬 Comprehensive Course',
          url: 'https://www.youtube.com/results?search_query=graph+algorithms+for+technical+interviews+william+fiset',
          category: 'youtube',
          icon: 'fa-brands fa-youtube text-rose-500'
        },
        {
          title: 'LeetCode Curated Graph Problems',
          provider: 'LeetCode',
          channel: 'LeetCode Practice',
          concept: 'Cycle detection, Course Schedule, Connected Components, and Word Ladder',
          badge: '💻 Benchmark Problems',
          url: 'https://leetcode.com/problemset/all/?topicSlugs=graph',
          category: 'coding_platform',
          icon: 'fa-solid fa-code text-amber-500'
        },
        {
          title: 'NeetCode 150 Graph Practice Roadmap',
          provider: 'NeetCode.io',
          channel: 'NeetCode',
          concept: 'Number of islands, Pacific Atlantic water flow, clone graph',
          badge: '🗺️ Curated List',
          url: 'https://neetcode.io/practice',
          category: 'learning_material',
          icon: 'fa-solid fa-diagram-project text-cyan-500'
        }
      ],
      suggestions: [
        'Solve Course Schedule (LeetCode 207) with Kahn’s Algorithm',
        'Implement BFS shortest path on unweighted grid',
        'Master Disjoint Set Union (DSU) with path compression'
      ]
    },

    // 5. Dynamic Programming
    {
      keywords: ['dynamic programming', 'dp', 'knapsack', 'memoization', 'tabulation', 'subsequence', 'coin change'],
      intent: 'dsa_dp',
      sources: [
        {
          title: 'Dynamic Programming - Learn to Solve Any DP Problem',
          provider: 'YouTube',
          channel: 'freeCodeCamp',
          concept: 'Memoization recipe, tabulation recipe, grid traveler, canSum, howSum',
          badge: '🎬 Masterclass',
          url: 'https://www.youtube.com/results?search_query=dynamic+programming+freecodecamp',
          category: 'youtube',
          icon: 'fa-brands fa-youtube text-rose-500'
        },
        {
          title: 'LeetCode Curated Dynamic Programming Problems',
          provider: 'LeetCode',
          channel: 'LeetCode Practice',
          concept: '0/1 Knapsack, Coin Change, Longest Increasing Subsequence, and Word Break',
          badge: '💻 Core Problems',
          url: 'https://leetcode.com/problemset/all/?topicSlugs=dynamic-programming',
          category: 'coding_platform',
          icon: 'fa-solid fa-code text-amber-500'
        },
        {
          title: 'NeetCode 150 1D & 2D Dynamic Programming Section',
          provider: 'NeetCode.io',
          channel: 'NeetCode Official',
          concept: 'Systematic progression from Climbing Stairs to Edit Distance and Burst Balloons',
          badge: '🗺️ DP Roadmap',
          url: 'https://neetcode.io/practice',
          category: 'learning_material',
          icon: 'fa-solid fa-layer-group text-indigo-500'
        }
      ],
      suggestions: [
        'Write 0/1 Knapsack recurrence relation clearly',
        'Implement Longest Common Subsequence (LCS) bottom-up',
        'Optimize space from 2D table to 1D previous row buffer'
      ]
    },

    // 6. System Design & Scalability
    {
      keywords: ['system design', 'hld', 'lld', 'microservices', 'load balancer', 'cache', 'sharding', 'redis', 'kafka', 'cdn', 'cap theorem'],
      intent: 'system_design',
      sources: [
        {
          title: 'System Design Primer by Donne Martin',
          provider: 'GitHub',
          channel: 'Donne Martin',
          concept: 'High-level architecture, scalability, caching, CDN, CAP theorem, and sharding',
          badge: '⭐ GitHub Standard',
          url: 'https://github.com/donnemartin/system-design-primer',
          category: 'github',
          icon: 'fa-brands fa-github text-purple-400'
        },
        {
          title: 'System Design Interview Architectural Breakdowns',
          provider: 'YouTube',
          channel: 'ByteByteGo',
          concept: 'Design rate limiter, URL shortener, notification system, and distributed cache',
          badge: '🎬 ByteByteGo Series',
          url: 'https://www.youtube.com/results?search_query=bytebytego+system+design+interview',
          category: 'youtube',
          icon: 'fa-brands fa-youtube text-rose-500'
        },
        {
          title: 'Roadmap.sh System Design Guide',
          provider: 'Roadmap.sh',
          channel: 'Roadmap Community',
          concept: 'Interactive architectural checklist, message queues, and horizontal partitioning',
          badge: '🗺️ Interactive Roadmap',
          url: 'https://roadmap.sh/system-design',
          category: 'learning_material',
          icon: 'fa-solid fa-server text-emerald-500'
        }
      ],
      suggestions: [
        'Review System Design Primer on GitHub',
        'Design a scalable URL shortener (TinyURL) with Redis caching',
        'Study CAP theorem and SQL vs NoSQL trade-offs'
      ]
    },

    // 7. Resume & ATS Preparation
    {
      keywords: ['resume', 'ats', 'ats score', 'bullet points', 'action verbs', 'projects', 'placement drive', 'xyz formula'],
      intent: 'career_resume',
      sources: [
        {
          title: 'MIT Career Advising - Action Verbs for Technical Resumes',
          provider: 'MIT CAPD',
          channel: 'MIT Career Services',
          concept: 'Clean single-column typography, impact quantification, power verbs',
          badge: '🎓 University Standard',
          url: 'https://capd.mit.edu/resources/resume-action-verbs/',
          category: 'learning_material',
          icon: 'fa-solid fa-graduation-cap text-amber-400'
        },
        {
          title: 'Tech Interview Handbook - Technical Resume Guide',
          provider: 'Tech Interview Handbook',
          channel: 'Yangshun Tay',
          concept: 'ATS optimization, technical project formatting, and recruiter screening criteria',
          badge: '⭐ Industry Guide',
          url: 'https://www.techinterviewhandbook.org/resume/',
          category: 'learning_material',
          icon: 'fa-solid fa-file-lines text-indigo-400'
        },
        {
          title: 'Software Engineer Resume Breakdown & Formatting',
          provider: 'YouTube',
          channel: 'Tech Career Mentors',
          concept: 'Google XYZ formula: Accomplished [X] as measured by [Y] by doing [Z]',
          badge: '🎬 Video Guide',
          url: 'https://www.youtube.com/results?search_query=software+engineer+resume+tips',
          category: 'youtube',
          icon: 'fa-brands fa-youtube text-rose-500'
        }
      ],
      suggestions: [
        'Reformat project bullets with the XYZ formula: Accomplished X measured by Y by doing Z',
        'Add quantifiable metrics (e.g. latency reduced by 35%, throughput increased 2x)',
        'Ensure single-column layout for ATS parser compatibility'
      ]
    },

    // 8. Behavioral & Placement Interviews
    {
      keywords: ['mock interview', 'behavioral', 'star method', 'hr round', 'introduction', 'tell me about yourself', 'leadership principles'],
      intent: 'career_interview',
      sources: [
        {
          title: 'The STAR Method for Behavioral Interviews',
          provider: 'YouTube',
          channel: 'Tech Recruiter Guides',
          concept: 'Situation, Task, Action, Result framework for behavioral leadership questions',
          badge: '🎬 Recruiter Guide',
          url: 'https://www.youtube.com/results?search_query=star+method+behavioral+interview',
          category: 'youtube',
          icon: 'fa-brands fa-youtube text-rose-500'
        },
        {
          title: 'Tech Interview Handbook - Behavioral Questions & Strategy',
          provider: 'Tech Interview Handbook',
          channel: 'Tech Interview Handbook',
          concept: '20+ top behavioral questions, conflict resolution, and project retrospectives',
          badge: '⭐ 100k+ Stars Guide',
          url: 'https://www.techinterviewhandbook.org/behavioral-interview/',
          category: 'learning_material',
          icon: 'fa-solid fa-handshake text-emerald-400'
        },
        {
          title: 'LeetCode Interview Discuss & Experiences',
          provider: 'LeetCode',
          channel: 'Community Submissions',
          concept: 'Real interview experiences, questions asked, and behavioral debriefs',
          badge: '💬 Real Experiences',
          url: 'https://leetcode.com/discuss/interview-question',
          category: 'coding_platform',
          icon: 'fa-solid fa-comments text-amber-400'
        }
      ],
      suggestions: [
        'Prepare 3 STAR stories covering technical hurdles, leadership, and conflict resolution',
        'Practice your 90-second "Tell me about yourself" elevator pitch',
        'Take a 25-question mock proctored interview in SkillSync AI'
      ]
    },

    // 9. Modern Web & Frontend Engineering
    {
      keywords: ['react', 'next.js', 'frontend', 'javascript', 'typescript', 'dom', 'css', 'tailwind', 'html', 'vue', 'web performance'],
      intent: 'web_frontend',
      sources: [
        {
          title: 'Official React Documentation & Modern Hooks',
          provider: 'React.dev',
          channel: 'React Core Team',
          concept: 'Components, state, effects, hooks, suspense, and server components',
          badge: '📘 Official Docs',
          url: 'https://react.dev/learn',
          category: 'learning_material',
          icon: 'fa-brands fa-react text-cyan-400'
        },
        {
          title: 'MDN Web Docs - JavaScript & Modern Web Standards',
          provider: 'Mozilla MDN',
          channel: 'MDN Web Docs',
          concept: 'Event loop, asynchronous promises, prototypes, and browser APIs',
          badge: '🌐 Web Standard',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          category: 'learning_material',
          icon: 'fa-brands fa-js text-yellow-400'
        },
        {
          title: 'Roadmap.sh Frontend Developer Roadmap',
          provider: 'Roadmap.sh',
          channel: 'Roadmap Community',
          concept: 'Modern frontend tooling, state management, accessibility, and bundlers',
          badge: '🗺️ Interactive Roadmap',
          url: 'https://roadmap.sh/frontend',
          category: 'learning_material',
          icon: 'fa-solid fa-compass text-emerald-500'
        }
      ],
      suggestions: [
        'Explain React virtual DOM diffing and reconciliation algorithm',
        'Master the difference between useMemo, useCallback, and React.memo',
        'Review Event Loop, microtasks, and macrotasks execution order'
      ]
    },

    // 10. Backend Engineering & Node.js
    {
      keywords: ['node.js', 'express', 'backend', 'api', 'rest', 'graphql', 'middleware', 'authentication', 'jwt'],
      intent: 'backend_engineering',
      sources: [
        {
          title: 'Official Node.js Documentation & Runtime Guide',
          provider: 'Node.js',
          channel: 'Node.js Foundation',
          concept: 'Event loop, streams, buffers, child processes, and asynchronous I/O',
          badge: '📘 Official Docs',
          url: 'https://nodejs.org/en/docs',
          category: 'learning_material',
          icon: 'fa-brands fa-node-js text-emerald-500'
        },
        {
          title: 'MDN Express & Node.js Server-Side Tutorial',
          provider: 'Mozilla MDN',
          channel: 'MDN Web Docs',
          concept: 'Routing, middleware chains, MVC architecture, and database integration',
          badge: '🌐 Web Standard',
          url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs',
          category: 'learning_material',
          icon: 'fa-solid fa-server text-indigo-400'
        },
        {
          title: 'Roadmap.sh Backend Developer Roadmap',
          provider: 'Roadmap.sh',
          channel: 'Roadmap Community',
          concept: 'API security, caching strategies, relational data modeling, and testing',
          badge: '🗺️ Complete Roadmap',
          url: 'https://roadmap.sh/backend',
          category: 'learning_material',
          icon: 'fa-solid fa-network-wired text-cyan-400'
        }
      ],
      suggestions: [
        'Explain Node.js event-driven non-blocking I/O and worker threads',
        'Design a production RESTful API structure with input validation and rate limiting',
        'Implement JWT authentication with secure httpOnly cookie rotation'
      ]
    },

    // 11. Databases & SQL / NoSQL
    {
      keywords: ['database', 'sql', 'nosql', 'postgres', 'postgresql', 'mongodb', 'acid', 'indexing', 'b-tree', 'normalization'],
      intent: 'databases',
      sources: [
        {
          title: 'PostgreSQL Official Documentation',
          provider: 'PostgreSQL Global Group',
          channel: 'PostgreSQL Core Team',
          concept: 'ACID guarantees, indexing strategies (B-Tree, GIN, GiST), and query planning',
          badge: '📘 Official Reference',
          url: 'https://www.postgresql.org/docs/',
          category: 'learning_material',
          icon: 'fa-solid fa-database text-blue-400'
        },
        {
          title: 'MongoDB Official Documentation & Data Modeling',
          provider: 'MongoDB Inc.',
          channel: 'MongoDB Official',
          concept: 'Document schemas, aggregation pipelines, replication sets, and sharding',
          badge: '🍃 Official Docs',
          url: 'https://www.mongodb.com/docs/',
          category: 'learning_material',
          icon: 'fa-solid fa-leaf text-emerald-500'
        },
        {
          title: 'Roadmap.sh PostgreSQL DBA & Query Optimization',
          provider: 'Roadmap.sh',
          channel: 'Database Community',
          concept: 'EXPLAIN ANALYZE, transaction isolation levels, and vacuum management',
          badge: '🗺️ DB Roadmap',
          url: 'https://roadmap.sh/postgresql-dba',
          category: 'learning_material',
          icon: 'fa-solid fa-table text-indigo-400'
        }
      ],
      suggestions: [
        'Differentiate clustered vs non-clustered indexes and B-Tree traversals',
        'Explain the 4 ANSI SQL transaction isolation levels and concurrency anomalies',
        'Design normalized 3NF relational schemas vs MongoDB denormalized documents'
      ]
    },

    // 12. DevOps, Cloud & Containers
    {
      keywords: ['docker', 'kubernetes', 'k8s', 'devops', 'ci/cd', 'container', 'aws', 'cloud', 'github actions', 'terraform'],
      intent: 'devops_cloud',
      sources: [
        {
          title: 'Docker Official Getting Started Guide',
          provider: 'Docker Inc.',
          channel: 'Docker Official',
          concept: 'Container images, multi-stage Dockerfiles, volumes, and bridge networking',
          badge: '🐳 Official Docs',
          url: 'https://docs.docker.com/get-started/',
          category: 'learning_material',
          icon: 'fa-brands fa-docker text-blue-400'
        },
        {
          title: 'Kubernetes Official Documentation & Concepts',
          provider: 'CNCF / Kubernetes',
          channel: 'Kubernetes Maintainers',
          concept: 'Pods, Deployments, Services, Ingress, ConfigMaps, and cluster autoscaling',
          badge: '☸️ Official Reference',
          url: 'https://kubernetes.io/docs/home/',
          category: 'learning_material',
          icon: 'fa-solid fa-cubes text-cyan-400'
        },
        {
          title: 'Roadmap.sh DevOps & Cloud Roadmap',
          provider: 'Roadmap.sh',
          channel: 'DevOps Community',
          concept: 'Infrastructure as Code, CI/CD pipelines, container orchestration, and observability',
          badge: '🗺️ DevOps Roadmap',
          url: 'https://roadmap.sh/devops',
          category: 'learning_material',
          icon: 'fa-solid fa-gears text-amber-400'
        }
      ],
      suggestions: [
        'Write a multi-stage Dockerfile to minimize production image size',
        'Explain the difference between a Kubernetes Pod, ReplicaSet, and Deployment',
        'Set up automated GitHub Actions workflow for linting, testing, and deployment'
      ]
    },

    // 13. Python & Core Programming
    {
      keywords: ['python', 'oop', 'concurrency', 'multithreading', 'gil', 'generator', 'decorator', 'asyncio'],
      intent: 'python_programming',
      sources: [
        {
          title: 'Official Python 3 Documentation & Tutorial',
          provider: 'Python Software Foundation',
          channel: 'Python Core',
          concept: 'Data model, generators, iterators, context managers, and standard library',
          badge: '🐍 Official Docs',
          url: 'https://docs.python.org/3/tutorial/index.html',
          category: 'learning_material',
          icon: 'fa-brands fa-python text-yellow-400'
        },
        {
          title: 'Roadmap.sh Python Developer Roadmap',
          provider: 'Roadmap.sh',
          channel: 'Python Community',
          concept: 'Advanced typing, packaging, asyncio asynchronous programming, and web frameworks',
          badge: '🗺️ Python Track',
          url: 'https://roadmap.sh/python',
          category: 'learning_material',
          icon: 'fa-solid fa-code text-blue-400'
        },
        {
          title: 'Real Python In-Depth Technical Tutorials',
          provider: 'Real Python',
          channel: 'Real Python Staff',
          concept: 'Global Interpreter Lock (GIL), multiprocessing vs threading, and design patterns',
          badge: '📘 Practical Tutorials',
          url: 'https://realpython.com/',
          category: 'learning_material',
          icon: 'fa-solid fa-laptop-code text-emerald-400'
        }
      ],
      suggestions: [
        'Explain the Global Interpreter Lock (GIL) and how multiprocessing circumvents it',
        'Write a custom decorator with function arguments and functools.wraps',
        'Implement an asynchronous producer-consumer pipeline with asyncio.Queue'
      ]
    },

    // 14. Security, Auth & Networking
    {
      keywords: ['security', 'owasp', 'jwt', 'oauth', 'oauth2', 'https', 'ssl', 'tls', 'csrf', 'xss', 'sql injection', 'cors'],
      intent: 'security_networking',
      sources: [
        {
          title: 'OWASP Top 10 Security Vulnerabilities',
          provider: 'OWASP Foundation',
          channel: 'OWASP Project',
          concept: 'Broken access control, injection attacks, cryptographic failures, and security misconfigurations',
          badge: '🛡️ Global Standard',
          url: 'https://owasp.org/www-project-top-ten/',
          category: 'learning_material',
          icon: 'fa-solid fa-shield-virus text-rose-500'
        },
        {
          title: 'MDN Web Security & CORS Guide',
          provider: 'Mozilla MDN',
          channel: 'MDN Web Docs',
          concept: 'Same-Origin Policy, Cross-Origin Resource Sharing (CORS), CSP headers, and HTTPS',
          badge: '🌐 Web Standard',
          url: 'https://developer.mozilla.org/en-US/docs/Web/Security',
          category: 'learning_material',
          icon: 'fa-solid fa-lock text-emerald-400'
        },
        {
          title: 'Roadmap.sh Cyber Security & Application Hardening',
          provider: 'Roadmap.sh',
          channel: 'Security Community',
          concept: 'PKI, TLS handshake steps, authentication protocols, and threat modeling',
          badge: '🗺️ Security Roadmap',
          url: 'https://roadmap.sh/cyber-security',
          category: 'learning_material',
          icon: 'fa-solid fa-user-shield text-indigo-400'
        }
      ],
      suggestions: [
        'Explain Cross-Site Scripting (XSS) vs Cross-Site Request Forgery (CSRF) defenses',
        'Describe the 4 steps of the TLS 1.3 cryptographic handshake',
        'Audit REST APIs for proper CORS headers and Content Security Policy (CSP)'
      ]
    }
  ],

  /**
   * Helper to match verified resources against query text and detected intent
   */
  matchVerifiedResources(query = '', intent = '') {
    const q = (query || '').toLowerCase();
    for (const item of mentorConfig.VERIFIED_RESOURCES) {
      if (intent && item.intent === intent) {
        return { sources: item.sources, suggestions: item.suggestions };
      }
      for (const kw of item.keywords) {
        if (q.includes(kw)) {
          return { sources: item.sources, suggestions: item.suggestions };
        }
      }
    }

    // Default general technical resources
    return {
      sources: [
        {
          title: 'NeetCode 150 - Complete Coding Interview Roadmap',
          provider: 'NeetCode.io',
          channel: 'NeetCode',
          concept: 'Curated 150 essential DSA problems across all high-frequency patterns',
          badge: '🗺️ Essential Roadmap',
          url: 'https://neetcode.io/practice',
          category: 'learning_material',
          icon: 'fa-solid fa-code text-indigo-500'
        },
        {
          title: 'System Design Primer',
          provider: 'GitHub',
          channel: 'Donne Martin',
          concept: 'Learn how to design large-scale systems for software engineering interviews',
          badge: '⭐ GitHub Benchmark',
          url: 'https://github.com/donnemartin/system-design-primer',
          category: 'github',
          icon: 'fa-brands fa-github text-purple-400'
        }
      ],
      suggestions: [
        'Ask about a specific DSA pattern (e.g. Sliding Window, Graphs, Dynamic Programming)',
        'Ask how to improve your Resume bullet points with the Google XYZ formula',
        'Request a mock interview practice strategy for your target role'
      ]
    };
  }
};

module.exports = mentorConfig;
