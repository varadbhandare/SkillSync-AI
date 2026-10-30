/**
 * SkillSync AI - Architectural, Algorithmic & Engineering Manual PDF Generator
 * Compiles a publication-grade technical specification and renders it to PDF via headless Chromium.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const outputPath = path.resolve('D:/MEGA PROJECT/SkillSyncAI/SkillSync_AI_Architecture_and_Algorithms_Manual.pdf');
const tempHtmlPath = path.resolve(__dirname, 'manual_template.html');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SkillSync AI - Complete Architectural & Algorithmic Blueprint</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: "Page " counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @bottom-left {
        content: "SkillSync AI • Confidential Technical Specification";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.55;
      font-size: 9.5pt;
    }

    .page {
      page-break-after: always;
      position: relative;
    }

    .no-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 20px 20px 20px;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      font-size: 8.5pt;
      font-weight: 700;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 30pt;
      font-weight: 800;
      line-height: 1.15;
      color: #090d16;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
    }

    .cover-subtitle {
      font-size: 13pt;
      font-weight: 500;
      color: #475569;
      line-height: 1.4;
      margin-bottom: 28px;
    }

    .cover-meta {
      border-top: 2px solid #e2e8f0;
      padding-top: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      font-size: 8.5pt;
      color: #334155;
    }

    .cover-meta dt {
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.05em;
    }

    /* Headings */
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 6px;
      margin-top: 14px;
      margin-bottom: 14px;
      letter-spacing: -0.02em;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 16px;
      margin-bottom: 8px;
      border-left: 3.5px solid #6366f1;
      padding-left: 8px;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 8px;
      text-align: justify;
    }

    /* Code & Callouts */
    pre, code {
      font-family: 'JetBrains Mono', monospace;
    }

    code {
      background: #f1f5f9;
      padding: 1.5px 4px;
      border-radius: 4px;
      font-size: 8.5pt;
      color: #4338ca;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 10px 0;
      border: 1px solid #1e293b;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
      border: none;
    }

    .callout {
      background: #f8fafc;
      border-left: 4px solid #6366f1;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 10px 0;
      font-size: 9pt;
      border: 1px solid #e2e8f0;
      border-left-width: 4px;
    }

    .callout-title {
      font-weight: 700;
      color: #4338ca;
      margin-bottom: 3px;
      font-size: 9pt;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .formula-box {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 10px 0;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #312e81;
      font-size: 9.5pt;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 8.5pt;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f8fafc;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.04em;
    }

    tr:nth-child(even) td {
      background: #fbfcfe;
    }

    /* Grid & Cards */
    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 10px 0;
    }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
    }

    .card h4 {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 3px;
    }

    .badge {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .badge-primary { background: #e0e7ff; color: #3730a3; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #ffe4e6; color: #9f1239; }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 8px;
    }

    li {
      margin-bottom: 3px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page cover-container">
    <div>
      <div class="cover-badge">Engineering Reference Manual • v2.5 Production</div>
      <h1 class="cover-title">SkillSync AI<br>Platform Architecture, Algorithms &amp; System Methods</h1>
      <p class="cover-subtitle">
        A Comprehensive Technical Blueprint of the Autonomous Placement Readiness, Edge Computer Vision Proctoring, Two-Tier Hybrid NLP Grading, and Real-Time AI Mentorship Platform
      </p>

      <div class="callout" style="background: #faf5ff; border-left-color: #8b5cf6;">
        <div class="callout-title" style="color: #6b21a8;">System Mission &amp; Architectural Mandate</div>
        SkillSync AI is an enterprise-grade career placement and technical evaluation ecosystem. It unifies real-time WebRTC/TensorFlow edge proctoring, multi-modal LLM evaluation (Google Gemini 2.5 Flash), deterministic rule-based NLP failovers, Server-Sent Events (SSE) AI mentoring, ATS resume screening, and machine learning placement probability scoring into a cohesive single-file frontend and hardened Express/MongoDB backend.
      </div>
    </div>

    <div class="cover-meta">
      <div>
        <dt>Platform Components</dt>
        <dd>Express 4.19, Mongoose 8.19, TensorFlow.js COCO-SSD, Gemini 2.5 Flash, Web Audio API, Web Speech API</dd>
      </div>
      <div>
        <dt>Security &amp; Compliance</dt>
        <dd>JWT Authentication, Helmet CSP, MongoSanitize, Rate Limiting, Single-Prompt WebRTC Lifecycle</dd>
      </div>
      <div>
        <dt>Document Scope</dt>
        <dd>Algorithms, Math Formulas, State Machines, Data Models, Scoring Rubrics &amp; Network Protocols</dd>
      </div>
      <div>
        <dt>Date &amp; Build</dt>
        <dd>October 2026 • Verified Production Build</dd>
      </div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="page">
    <h1>Table of Contents</h1>
    <table style="margin-top: 15px;">
      <thead>
        <tr>
          <th style="width: 10%;">Section</th>
          <th style="width: 60%;">Topic &amp; Architectural Focus</th>
          <th style="width: 30%;">Core Module</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>01</strong></td>
          <td>High-Level System Architecture &amp; Execution Topology</td>
          <td>Full Stack Architecture</td>
        </tr>
        <tr>
          <td><strong>02</strong></td>
          <td>Proctoring Computer Vision &amp; Web Audio Subsystem</td>
          <td>TensorFlow.js &bull; COCO-SSD &bull; Web Audio</td>
        </tr>
        <tr>
          <td><strong>03</strong></td>
          <td>Mock Interview Two-Tier Hybrid Grading Engine</td>
          <td>Gemini 2.5 Flash &bull; Deterministic NLP</td>
        </tr>
        <tr>
          <td><strong>04</strong></td>
          <td>Deterministic Rubric NLP &amp; Anti-Keyword Stuffing Algorithm</td>
          <td><code>interviewScoringService.js</code></td>
        </tr>
        <tr>
          <td><strong>05</strong></td>
          <td>Single-Prompt Hardware Permission State Machine</td>
          <td>WebRTC &bull; MediaStreams &bull; Web Speech API</td>
        </tr>
        <tr>
          <td><strong>06</strong></td>
          <td>AI Career Mentor SSE Streaming Protocol &amp; Knowledge Base</td>
          <td>Gemini SSE &bull; 14-Category Evergreen KB</td>
        </tr>
        <tr>
          <td><strong>07</strong></td>
          <td>ATS Resume Screener &amp; Entity Extraction Pipeline</td>
          <td>Regex Extraction &bull; Taxonomy Matcher</td>
        </tr>
        <tr>
          <td><strong>08</strong></td>
          <td>Live Coding Profiles Aggregator (GitHub &amp; LeetCode)</td>
          <td>GitHub REST v3 &bull; LeetCode GraphQL</td>
        </tr>
        <tr>
          <td><strong>09</strong></td>
          <td>Placement Readiness Index &amp; XGBoost CTC Bracket Model</td>
          <td>Composite Scoring &bull; ML Prediction</td>
        </tr>
        <tr>
          <td><strong>10</strong></td>
          <td>Data Dictionary &amp; Mongoose Object Schemas</td>
          <td>MongoDB 8 Schema Specifications</td>
        </tr>
      </tbody>
    </table>

    <div class="callout" style="margin-top: 25px;">
      <div class="callout-title">Document Purpose</div>
      This document serves as the authoritative technical manual for engineers, data scientists, and system architects maintaining or extending SkillSync AI. Every algorithm is explained with its exact mathematical formulations, operational constraints, time/space complexities, and edge-case failover mechanisms.
    </div>
  </div>

  <!-- SECTION 1: ARCHITECTURE OVERVIEW -->
  <div class="page">
    <h1>01. High-Level System Architecture</h1>
    <p>
      SkillSync AI employs a modern decoupled architecture where a single-file, zero-build vanilla JavaScript client connects via REST APIs and Server-Sent Events (SSE) to a secure Node.js/Express backend backed by MongoDB.
    </p>

    <h2>Architectural Topology</h2>
    <pre><code>+-----------------------------------------------------------------------------------+
|                        CLIENT BROWSER (Single-File SPA)                           |
|  - Vanilla JS, Tailwind CDN, Chart.js, TensorFlow.js COCO-SSD                     |
|  - WebRTC MediaStream Lifecycle (Single-Prompt Mic & Camera Engine)               |
|  - Web Audio API Real-Time VU Meter & Continuous Decibel FFT Analyser             |
|  - Web Speech API Zero-Latency Streaming Transcription (Singleton Pattern)        |
+-----------------------------------------------------------------------------------+
           | (HTTPS / REST)                                   ^ (SSE Stream)
           v                                                  |
+-----------------------------------------------------------------------------------+
|                      NODE.JS / EXPRESS 4.19 BACKEND ENGINE                        |
|  - Security Middleware: Helmet (Permissive CSP), MongoSanitize, Express RateLimit  |
|  - Authentication: JWT with 30d Expiration, Bcrypt Password Hashing               |
|  - Routing Gateways:                                                              |
|      /api/auth              -> User Registration, Login, Session Verification     |
|      /api/students          -> Student Profiles, Target Roles, Dynamic Goals      |
|      /api/resumes           -> ATS Screener, Identity Verification, Extraction    |
|      /api/coding-profiles   -> GitHub REST v3 & LeetCode GraphQL Sync             |
|      /api/modules/mentor    -> SSE Streaming Chatbot, 15s Heartbeats, Link Cache  |
|      /api/modules/interviews-> 25-Q Sessions, State Machine, Proctoring Ingestion |
+-----------------------------------------------------------------------------------+
           |                                                  |
           v                                                  v
+--------------------------+                      +---------------------------------+
|   MONGODB 8.0 STORAGE    |                      |      EXTERNAL AI & APIS         |
|  - Users & Students      |                      |  - Google Gemini 2.5 Flash      |
|  - Interview Sessions    |                      |  - GitHub Public REST v3 API    |
|  - Questions & Rubrics   |                      |  - LeetCode Public GraphQL API  |
|  - Mentor Chat Threads   |                      |  - 14 Evergreen Authoritative   |
|  - Resumes & Profiles    |                      |    Technical Documentation Roots|
+--------------------------+                      +---------------------------------+</code></pre>

    <h2>Core Architectural Principles</h2>
    <div class="card-grid">
      <div class="card">
        <h4>1. Zero-Trust Proctoring Ingestion</h4>
        <p>The client reports raw biometric events, but warning counts, policy threshold evaluation, score deductions, and session terminations are strictly computed and enforced server-side.</p>
      </div>
      <div class="card">
        <h4>2. Two-Tier Resilient Evaluation</h4>
        <p>All interview answers are evaluated via Google Gemini 2.5 Flash with structured Zod schemas. If the API is absent, timed out, or throttled, evaluation seamlessly falls back to a deterministic NLP rules engine.</p>
      </div>
      <div class="card">
        <h4>3. Single-Prompt Media Invariance</h4>
        <p>WebRTC camera and microphone streams are requested exactly once during pre-flight calibration. The persistent MediaStream is reused across all monitoring loops without mid-interview re-prompts.</p>
      </div>
      <div class="card">
        <h4>4. Unidirectional SSE Streaming</h4>
        <p>The AI Career Mentor leverages HTTP Server-Sent Events with dual-property compatibility (<code>token/text</code>) and 15-second heartbeat comments to ensure proxy-safe streaming.</p>
      </div>
    </div>
  </div>

  <!-- SECTION 2: PROCTORING CV & AUDIO -->
  <div class="page">
    <h1>02. Proctoring Computer Vision &amp; Audio Subsystem</h1>
    <p>
      The proctoring subsystem operates entirely within the candidate's browser at 60 FPS, utilizing client-side edge computing to guarantee data privacy while preventing examination malpractice.
    </p>

    <h2>1. TensorFlow.js &amp; COCO-SSD Object Detection Pipeline</h2>
    <p>
      A MobileNet v2 backbone running on WebGL/Wasm continuously scans candidate webcam frames for prohibited objects and biometric anomalies.
    </p>
    <table>
      <thead>
        <tr>
          <th>Violation Type</th>
          <th>Detection Mechanism</th>
          <th>Threshold / Hysteresis</th>
          <th>Server Mapping</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Prohibited Device</strong></td>
          <td>COCO-SSD classes: <code>cell phone</code>, <code>laptop</code>, <code>remote</code>, <code>tablet</code>, <code>book</code></td>
          <td>Confidence $\ge 0.38$, Streak $\ge 2$ (~800ms)</td>
          <td><code>PROHIBITED_OBJECT</code></td>
        </tr>
        <tr>
          <td><strong>Second Person</strong></td>
          <td>COCO-SSD class: <code>person</code> with count $\ge 2$</td>
          <td>Confidence $\ge 0.40$, Streak $\ge 2$</td>
          <td><code>MULTIPLE_PERSONS</code></td>
        </tr>
        <tr>
          <td><strong>Candidate Absence</strong></td>
          <td>COCO-SSD class: <code>person</code> with count $= 0$</td>
          <td>Duration $> 3.5\text{ seconds}$</td>
          <td><code>NO_FACE</code></td>
        </tr>
        <tr>
          <td><strong>Camera Obstruction</strong></td>
          <td>Average frame luminance $< 12$ or optical diff variance $= 0$</td>
          <td>Streak $\ge 5$ consecutive frames</td>
          <td><code>CAMERA_BLOCKED</code></td>
        </tr>
      </tbody>
    </table>

    <div class="callout">
      <div class="callout-title">Accessory-Safe Detection &amp; Grace Warning Heuristic</div>
      COCO-SSD frequently misclassifies legitimate wired headphones, headsets, or lapel microphones as a <code>cell phone</code>. SkillSync AI incorporates candidate equipment pre-declaration (<code>modalDeclareHeadset</code>). When declared, the detection engine grants a <strong>non-counted grace warning</strong> on the first detected object, displaying a visual banner before escalating to counted penalties.
    </div>

    <h2>2. Optical Motion &amp; Head Pose Analysis</h2>
    <p>
      To detect candidate distraction or side-glancing without heavy facial landmark libraries, an offscreen 160x120 canvas computes temporal frame differencing:
    </p>
    <div class="formula-box">
      \Delta I_t = \frac{1}{N} \sum_{x,y} |I_t(x,y) - I_{t-1}(x,y)|
    </div>
    <p>
      Where $I_t(x,y)$ represents the grayscale pixel intensity at coordinates $(x,y)$. If $\Delta I_t > 38.0$ consistently across 6 sampling frames (~2.4s), a <code>LOOKING_AWAY</code> warning is registered.
    </p>

    <h2>3. Web Audio API Decibel &amp; Noise Analysis</h2>
    <p>
      An <code>AnalyserNode</code> ($FFT = 256$, smoothing $= 0.4$) computes the average spectral intensity:
    </p>
    <div class="formula-box">
      \bar{V} = \frac{1}{K} \sum_{k=0}^{K-1} |X(f_k)|
    </div>
    <p>
      If $\bar{V} > 84$ for 8 consecutive checks (~2.4 seconds) and speech transcription is inactive, a <code>MIC_NOISE</code> violation is reported. If the candidate is actively speaking into the microphone, noise alerts are suppressed to prevent false penalties.
    </p>
  </div>

  <!-- SECTION 3: TWO-TIER SCORING -->
  <div class="page">
    <h1>03. Two-Tier Hybrid Grading Engine</h1>
    <p>
      To combine high-level semantic reasoning with guaranteed deterministic availability, SkillSync AI implements a dual-tier evaluation architecture.
    </p>

    <h2>Grading Workflow</h2>
    <pre><code>Candidate Submits Answer
          │
          ▼
   Normalize Transcript (Normalize casing, strip filler words, check glue ratio)
          │
          ├───► Check GEMINI_API_KEY Available?
          │         │
          │         ├─► YES: Call Gemini 2.5 Flash with LlmJudgmentSchema
          │         │         │
          │         │         ├─► SUCCESS: Validate via Zod & Award Marks
          │         │         │
          │         │         └─► TIMEOUT / ERROR: Log Alert & Failover to Tier-2
          │         │
          │         └─► NO / FAILOVER: Execute Tier-2 Deterministic NLP Rubric
          │
          ▼
   Apply Deductive Proctoring Penalty: -0.5 pts per server-counted violation
          │
          ▼
   Return Evaluated Marks, Breakdown, Feedback & Conditions to Frontend</code></pre>

    <h2>Tier-1: Google Gemini 2.5 Flash LLM Evaluator</h2>
    <p>
      When an API key is configured, answers are evaluated using the official <code>@google/genai</code> SDK with a strict Zod structured output schema:
    </p>
    <table>
      <thead>
        <tr>
          <th>Schema Field</th>
          <th>Type / Range</th>
          <th>Evaluation Role</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>conditionJudgments</code></td>
          <td>Array of Objects</td>
          <td>Evaluates coverage ($0, 0.5, 1.0$) and correctness with an exact candidate evidence quote.</td>
        </tr>
        <tr>
          <td><code>depthLevel</code></td>
          <td>Integer: 0 to 3</td>
          <td>0: None, 1: Surface, 2: Sound, 3: Expert (Architecture &amp; Complexity).</td>
        </tr>
        <tr>
          <td><code>clarityLevel</code></td>
          <td>Integer: 0 to 4</td>
          <td>0: Incoherent, 1: Fragmented, 2: Understandable, 3: Structured, 4: Exemplary.</td>
        </tr>
        <tr>
          <td><code>isOffTopic</code></td>
          <td>Boolean</td>
          <td>Flags answers that do not address the question asked.</td>
        </tr>
        <tr>
          <td><code>keywordStuffingDetected</code></td>
          <td>Boolean</td>
          <td>Identifies recited lists of keywords without explanatory grammar.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 4: DETERMINISTIC NLP -->
  <div class="page">
    <h1>04. Deterministic NLP &amp; Anti-Stuffing Algorithm</h1>
    <p>
      The deterministic rubric implemented in <code>services/interviewScoringService.js</code> provides production-grade offline scoring without hallucination.
    </p>

    <h2>1. Spoken Transcript Normalization</h2>
    <p>
      Raw Web Speech transcripts contain disfluencies. The normalizer strips 16 conversational filler words (<em>um, uh, er, actually, basically, literally, you know...</em>) while preserving technical identifiers.
    </p>

    <h2>2. Grammatical Glue Ratio ($R_{\text{glue}}$)</h2>
    <p>
      To distinguish between authentic technical explanations and keyword stuffing, the engine tracks 54 grammatical function words (<em>the, is, because, therefore, while, in, with...</em>):
    </p>
    <div class="formula-box">
      R_{\text{glue}} = \frac{N_{\text{glue}}}{N_{\text{tokens}}}, \quad R_{\text{unique}} = \frac{|\text{Set}(T_{\text{tokens}})|}{|T_{\text{tokens}}|}
    </div>
    <div class="callout">
      <div class="callout-title">Keyword Stuffing Guardrail</div>
      If a candidate submits a long response ($N \ge 14$ words) with $R_{\text{glue}} < 0.10$ or $R_{\text{unique}} < 0.35$, the answer is flagged as keyword stuffing. Concept marks are capped at $2.0 / 5.0$, and technical depth and clarity marks are set to $0.0$.
    </div>

    <h2>3. Mathematical Scoring Model</h2>
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Max Marks</th>
          <th>Mathematical Formulation &amp; Logic</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Concept Coverage</strong></td>
          <td>$5.0$</td>
          <td>$M_{\text{concept}} = 5.0 \times \frac{\sum P_{\text{condition}}}{\sum P_{\text{max}}}$, where regex $\backslash b\text{term}\backslash b$ matches condition keywords.</td>
        </tr>
        <tr>
          <td><strong>Technical Depth</strong></td>
          <td>$3.0$</td>
          <td>$M_{\text{depth}} = 3.0 \times \min(1.0, 2.0 \times \text{Jaccard}(T_{\text{candidate}}, T_{\text{ideal}}))$. Raw token overlap without artificial minimums.</td>
        </tr>
        <tr>
          <td><strong>Clarity &amp; Structure</strong></td>
          <td>$2.0$</td>
          <td>Requires at least one satisfied condition. $0.5$ for length $\ge 15$, $0.5$ for length $\ge 35$, $0.5$ for logical transitions (<em>because, therefore, in contrast</em>), $0.5$ for lexical diversity ($R_{\text{unique}} \ge 0.65$).</td>
        </tr>
        <tr>
          <td><strong>Proctoring Penalty</strong></td>
          <td>$-2.5$</td>
          <td>$P_{\text{deducted}} = \min(2.5, N_{\text{violations}} \times 0.5)$. Deducted strictly from server-side counted logs.</td>
        </tr>
      </tbody>
    </table>

    <div class="formula-box">
      \text{Final Score} = \max\Big(0.0, \, \min\big(10.0, \, M_{\text{concept}} + M_{\text{depth}} + M_{\text{clarity}} - P_{\text{deducted}}\big)\Big)
    </div>
  </div>

  <!-- SECTION 5: HARDWARE LIFECYCLE -->
  <div class="page">
    <h1>05. Single-Prompt WebRTC State Machine</h1>
    <p>
      To prevent annoying repeated microphone permission prompts during an interview, SkillSync AI enforces an invariant 6-phase state machine with track liveness verification.
    </p>

    <h2>Hardware State Machine</h2>
    <pre><code>   [IDLE] ─── User Enters Interview Tab
     │
     ▼
[PREFLIGHT] ── User Clicks "Allow Camera & Mic"
     │         - getUserMedia({video}) -> interviewState.videoStream
     │         - getUserMedia({audio}) -> interviewState.audioStream
     │         - Combine tracks into interviewState.stream
     │         - Enumerate devices and start Audio VU Meter
     ▼
  [READY] ──── Candidate Ready
     │         - If tracks already live, skip permission prompt on re-entry
     ▼
 [STARTING] ── User Clicks "Start 25-Question Assessment"
     │         - 1. Synchronously execute enterAppFullscreen() (User gesture)
     │         - 2. Bind stream to interviewVideo
     │         - 3. POST /api/modules/interviews/sessions (Create backend session)
     │         - 4. Start Singleton SpeechRecognition instance
     │         - (Rolls back to [READY] with error banner on failure)
     ▼
  [ACTIVE] ─── Examination in Progress
     │         - Esc Pressed -> Show non-blocking #fullscreenLostBanner (No modal)
     │         - Question 1..25 progression -> Keep audio track & recognition alive
     ▼
[COMPLETED] or [TERMINATED]
     - Stop all MediaStreamTracks (videoStream, audioStream, stream)
     - Close AudioContexts, clear timers, abort SpeechRecognition</code></pre>

    <h2>Invariant Enforcement Rules</h2>
    <ul>
      <li><strong>Track Pre-Check:</strong> Before invoking <code>navigator.mediaDevices.getUserMedia({ audio })</code>, the engine checks <code>stream.getAudioTracks().some(t => t.readyState === 'live')</code>. If live, acquisition is bypassed.</li>
      <li><strong>SpeechRecognition Singleton:</strong> <code>getOrCreateSpeechRecognition()</code> maintains a single instance across both the wizard speech test and all 25 assessment questions.</li>
      <li><strong>Restart Loop Throttling:</strong> If <code>recognition.onend</code> restarts more than 4 times within 1200 ms, retries are throttled with a 2500 ms backoff to prevent browser prompt flooding.</li>
      <li><strong>Device Switch Guard:</strong> <code>handleMicDeviceChange</code> is disabled once the interview enters the <code>ACTIVE</code> phase.</li>
    </ul>
  </div>

  <!-- SECTION 6: MENTOR SSE -->
  <div class="page">
    <h1>06. AI Mentor SSE Streaming Engine</h1>
    <p>
      The Career Mentor chatbot provides an interactive ChatGPT/Claude-style learning experience using Server-Sent Events (SSE) streaming with candidate profile context injection.
    </p>

    <h2>SSE Packet Protocol Specification</h2>
    <table>
      <thead>
        <tr>
          <th>Event Type</th>
          <th>Payload Structure</th>
          <th>Client Rendering Behavior</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>status</code></td>
          <td><code>{"type": "status", "message": "..."}</code></td>
          <td>Displays subtle pulsing status text below mentor chat header.</td>
        </tr>
        <tr>
          <td><code>thought</code></td>
          <td><code>{"type": "thought", "token": "..."}</code></td>
          <td>Streams reasoning tokens into collapsible "Thinking Process" accordion.</td>
        </tr>
        <tr>
          <td><code>thought_done</code></td>
          <td><code>{"type": "thought_done", "durationSec": 1.4}</code></td>
          <td>Closes thinking stream and displays elapsed reasoning time badge.</td>
        </tr>
        <tr>
          <td><code>token</code></td>
          <td><code>{"type": "token", "token": "...", "text": "..."}</code></td>
          <td>Dual-property token stream. Appends markdown text live into chat bubble.</td>
        </tr>
        <tr>
          <td><code>sources</code></td>
          <td><code>{"type": "sources", "sources": [...]}</code></td>
          <td>Renders interactive verified documentation chips and video tutorial links.</td>
        </tr>
        <tr>
          <td><code>suggestions</code></td>
          <td><code>{"type": "suggestions", "suggestions": [...]}</code></td>
          <td>Renders clickable follow-up technical questions and prompt chips.</td>
        </tr>
        <tr>
          <td><code>done</code></td>
          <td><code>{"type": "done", "sessionId": "...", "messageId": "..."}</code></td>
          <td>Commits message to database, restores input field, and enables copy button.</td>
        </tr>
      </tbody>
    </table>

    <h2>14-Category Evergreen Knowledge Base</h2>
    <p>
      To prevent 404 link rot, <code>config/mentorConfig.js</code> references 39 verified authoritative roots (<em>react.dev, nodejs.org, postgresql.org, mit.edu, roadmap.sh</em>) and dynamic YouTube search queries:
    </p>
    <pre><code>https://www.youtube.com/results?search_query=sliding+window+two+pointer+leetcode+patterns</code></pre>
    <p>
      All external URLs are monitored via an in-memory HTTP HEAD status validator with a 24-hour cache TTL (<code>linkCache</code>).
    </p>
  </div>

  <!-- SECTION 7: ATS RESUME SCREENER -->
  <div class="page">
    <h1>07. ATS Resume Screener &amp; Entity Pipeline</h1>
    <p>
      The ATS Screener parses uploaded resume plaintext, validates candidate identity against student records, and computes a multi-pillar compatibility score.
    </p>

    <h2>1. Identity Cross-Validation Pipeline</h2>
    <p>
      To prevent students from submitting third-party resumes, the parser extracts candidate metadata and compares it against MongoDB student profile records:
    </p>
    <ul>
      <li><strong>Email Extraction:</strong> <code>/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi</code></li>
      <li><strong>Phone Extraction:</strong> <code>/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[\s-]?\d{10}/gi</code></li>
      <li><strong>GitHub Handle Extraction:</strong> <code>github.com/([a-zA-Z0-9_\-\.]+)</code> (Ignoring static paths like /signup, /pricing)</li>
      <li><strong>LeetCode Handle Extraction:</strong> <code>leetcode.com/(?:u/)?([a-zA-Z0-9_\-\.]+)</code></li>
    </ul>

    <h2>2. Three-Pillar ATS Scoring Model</h2>
    <div class="formula-box">
      \text{ATS Score} = 0.50 \times S_{\text{keywords}} + 0.25 \times S_{\text{verbs}} + 0.25 \times S_{\text{format}}
    </div>
    <table>
      <thead>
        <tr>
          <th>Pillar</th>
          <th>Weight</th>
          <th>Formulation &amp; Benchmark Criteria</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Keyword Density ($S_{\text{keywords}}$)</strong></td>
          <td>$50\%$</td>
          <td>$S_{\text{keywords}} = \frac{N_{\text{matched}}}{N_{\text{taxonomy}}} \times 100$. Checked against 15 target role skills (e.g. PyTorch, FastAPI, Milvus for AI/ML).</td>
        </tr>
        <tr>
          <td><strong>Action Verbs ($S_{\text{verbs}}$)</strong></td>
          <td>$25\%$</td>
          <td>$S_{\text{verbs}} = \min(100, \frac{N_{\text{action\_verbs}}}{8} \times 100)$. Evaluates 25 high-impact engineering action verbs (<em>architected, deployed, optimized, spearhead</em>).</td>
        </tr>
        <tr>
          <td><strong>Formatting ($S_{\text{format}}$)</strong></td>
          <td>$25\%$</td>
          <td>Base score $30\%$. $+15\%$ Education, $+20\%$ Technical Skills, $+20\%$ Projects/Experience, $+15\%$ Certifications/Awards.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 8: CODING PROFILES -->
  <div class="page">
    <h1>08. Live Coding Profiles Aggregator</h1>
    <p>
      SkillSync AI integrates live coding metrics directly from GitHub and LeetCode APIs without requiring user passwords.
    </p>

    <h2>1. GitHub Public REST API v3 Integration</h2>
    <p>
      Queries <code>https://api.github.com/users/:username</code> and <code>/repos?per_page=30&sort=pushed</code> to derive:
    </p>
    <ul>
      <li><strong>Star Count:</strong> Total stargazers across all public repositories.</li>
      <li><strong>Language Distribution:</strong> Aggregates primary programming languages weighted by repository count.</li>
      <li><strong>Commit Velocity:</strong> Recent push activity over the last 90 days.</li>
    </ul>

    <h2>2. LeetCode GraphQL Live Integration</h2>
    <p>
      Executes native GraphQL queries against <code>https://leetcode.com/graphql/</code>:
    </p>
    <pre><code>query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    userCalendar {
      streak
      totalActiveDays
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    topPercentage
  }
}</code></pre>
  </div>

  <!-- SECTION 9: PLACEMENT READINESS & ML -->
  <div class="page">
    <h1>09. Placement Readiness Index &amp; ML CTC Model</h1>
    <p>
      The Placement Readiness module consolidates all diagnostic dimensions into a composite index and predicts campus placement CTC salary brackets.
    </p>

    <h2>Composite Readiness Formulation</h2>
    <div class="formula-box">
      \text{Readiness Index} = 0.30 \times S_{\text{resume}} + 0.25 \times S_{\text{leetcode}} + 0.20 \times S_{\text{github}} + 0.25 \times S_{\text{interview}}
    </div>

    <h2>360-Degree Competency Radar</h2>
    <p>
      Generates candidate vs. campus benchmark radar charts across 6 competencies:
    </p>
    <div class="card-grid">
      <div class="card">
        <h4>1. DSA &amp; Algorithms</h4>
        <p>Derived from LeetCode Medium/Hard solved ratios and interview algorithmic condition marks.</p>
      </div>
      <div class="card">
        <h4>2. System Design &amp; Architecture</h4>
        <p>Evaluates database indexing, microservices, and concurrency question responses.</p>
      </div>
      <div class="card">
        <h4>3. APIs &amp; Backend Engineering</h4>
        <p>Assessed via GitHub repository frameworks, REST API roadmaps, and resume projects.</p>
      </div>
      <div class="card">
        <h4>4. Communication &amp; Verbal Clarity</h4>
        <p>Derived from interview clarity rubric and transition words frequency in oral transcripts.</p>
      </div>
    </div>

    <h2>XGBoost Multi-Class CTC Bracket Model</h2>
    <table>
      <thead>
        <tr>
          <th>Target CTC Bracket</th>
          <th>Profile Requirements</th>
          <th>Predicted Probability</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Tier-1 Product (18.0 - 45.0 LPA)</strong></td>
          <td>Readiness $\ge 85\%$, LeetCode Solved $\ge 300$, Mock Interview $\ge 8.5/10$</td>
          <td>$88.0\%$</td>
        </tr>
        <tr>
          <td><strong>Specialized AI/Fintech (8.5 - 18.0 LPA)</strong></td>
          <td>Readiness $\ge 75\%$, GitHub Stars $\ge 5$, ATS Resume Score $\ge 80/100$</td>
          <td>$92.0\%$</td>
        </tr>
        <tr>
          <td><strong>IT Services / Enterprise (4.5 - 8.5 LPA)</strong></td>
          <td>Readiness $\ge 60\%$, Core foundational languages and database verified</td>
          <td>$95.0\%$</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 10: DATA DICTIONARY -->
  <div class="page">
    <h1>10. Data Dictionary &amp; Schema Specifications</h1>
    <p>
      Mongoose Object Data Models enforce data integrity and relationship mapping across MongoDB collections.
    </p>

    <h2>1. InterviewSession Schema (<code>models/InterviewSession.js</code>)</h2>
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>sessionId</code></td>
          <td>UUID String</td>
          <td>Unique session identifier for state refresh recovery.</td>
        </tr>
        <tr>
          <td><code>user</code></td>
          <td>ObjectId &bull; Ref 'User'</td>
          <td>Candidate account ownership.</td>
        </tr>
        <tr>
          <td><code>questions</code></td>
          <td>Array of Objects</td>
          <td>25 selected questions with difficulty, transcripts, scores, and timestamps.</td>
        </tr>
        <tr>
          <td><code>warningCount</code></td>
          <td>Number (0 - 5)</td>
          <td>Server-side counted proctoring warnings.</td>
        </tr>
        <tr>
          <td><code>violations</code></td>
          <td>Array of Objects</td>
          <td>Detailed proctoring log with confidence, violation type, and server timestamp.</td>
        </tr>
        <tr>
          <td><code>status</code></td>
          <td>Enum</td>
          <td><code>'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED'</code>.</td>
        </tr>
      </tbody>
    </table>

    <h2>2. MentorChat Schema (<code>models/MentorChat.js</code>)</h2>
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>sessionId</code></td>
          <td>UUID String</td>
          <td>Chat conversation thread identifier.</td>
        </tr>
        <tr>
          <td><code>messages</code></td>
          <td>Array of Objects</td>
          <td>Includes <code>sender</code>, <code>content</code>, <code>thoughtSummary</code>, <code>platformSources</code>, <code>suggestedActions</code>, and <code>versions</code>.</td>
        </tr>
        <tr>
          <td><code>feedback</code></td>
          <td>Object</td>
          <td>Candidate thumbs up/down rating and comments.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout" style="margin-top: 30px;">
      <div class="callout-title">Architecture Summary &amp; Compliance Sign-off</div>
      SkillSync AI complies with enterprise engineering standards: zero unauthenticated data leaks, single-prompt media stream persistence, proxy-safe SSE communication, strict Zod schema validation, and multi-tier algorithmic failovers.
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
console.log('Temporary HTML template created at:', tempHtmlPath);

// Execute Chrome headless print-to-pdf
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
console.log('Rendering publication-grade PDF via Chrome...');

const res = spawnSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--no-pdf-header-footer',
  '--print-to-pdf=' + outputPath,
  tempHtmlPath
]);

if (res.status === 0 && fs.existsSync(outputPath)) {
  const stats = fs.statSync(outputPath);
  console.log('✅ PDF SUCCESSFULLY GENERATED!');
  console.log('Output Path:', outputPath);
  console.log('File Size:', stats.size, 'bytes');
} else {
  console.error('❌ PDF generation failed. Status code:', res.status);
  if (res.stderr) console.error(res.stderr.toString());
}

// Clean up temporary HTML file
try {
  fs.unlinkSync(tempHtmlPath);
} catch (e) {}
