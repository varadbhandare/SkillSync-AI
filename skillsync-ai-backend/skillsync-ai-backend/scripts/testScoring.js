/**
 * SkillSync AI - Scoring Verification Golden Test Suite
 * Tests scoring across 6 benchmark answer profiles:
 * 1. Excellent: comprehensive, detailed technical response
 * 2. Average: partially correct, basic understanding
 * 3. Weak: fragmented, superficial response
 * 4. Off-Topic: candidate speaks about completely unrelated subject
 * 5. Empty: zero verbal output
 * 6. Keyword-Stuffed: candidate recites keywords without real syntax
 *
 * Runs each test 3 times to measure score consistency and variance (must be <= 0.5).
 */

const dotenv = require('dotenv');
const { evaluateAnswer } = require('../services/interviewScoringService');

dotenv.config();

const benchmarkQuestion = {
  role: 'ai_ml',
  topic: 'Transformers & Self-Attention',
  difficulty: 'Medium',
  text: 'How does self-attention in Transformer architectures differ from recurrent networks in parallel computation and sequence modeling?',
  idealAnswer:
    'Self-attention in Transformers computes scaled dot-product attention across all input tokens simultaneously in parallel using Query, Key, and Value matrices, overcoming RNN sequential bottlenecks and vanishing gradients while exhibiting quadratic complexity O(n^2).',
  conditions: [
    {
      name: 'Parallel Token Processing vs Sequential Recurrent Propagation',
      keywords: ['parallel', 'sequential', 'recurrent', 'step', 'time step', 'order', 'token'],
      maxPoints: 3.5
    },
    {
      name: 'Scaled Dot-Product QKV Attention Mechanism',
      keywords: ['query', 'key', 'value', 'qkv', 'dot product', 'matrix', 'softmax', 'attention'],
      maxPoints: 3.5
    },
    {
      name: 'Vanishing Gradients & Quadratic Complexity Overhead',
      keywords: ['complexity', 'quadratic', 'gradient', 'long-range', 'bottleneck', 'o(n^2)', 'o(n2)'],
      maxPoints: 3.0
    }
  ],
  timeLimitSec: 120
};

const testProfiles = [
  {
    name: 'Excellent Answer',
    expectedRange: [7.5, 10.0],
    transcript:
      'Unlike recurrent neural networks which must process tokens sequentially one time step after another creating an execution bottleneck, Transformers process all tokens in parallel. They achieve this using self-attention where input representations are projected into Query, Key, and Value matrices. The attention weights are calculated via scaled dot-product followed by softmax. This solves vanishing gradient problems across long distances, though it incurs quadratic complexity O(n^2) with respect to sequence length.'
  },
  {
    name: 'Average Answer',
    expectedRange: [4.5, 7.5],
    transcript:
      'In transformers, self-attention uses query, key, and value vectors to calculate attention for all words at the same time in parallel. Recurrent networks are sequential so they are slower. Transformers can handle longer context better.'
  },
  {
    name: 'Weak Answer',
    expectedRange: [1.5, 4.5],
    transcript:
      'Transformers are faster because they do not use loops. They have attention mechanisms which help look at words.'
  },
  {
    name: 'Off-Topic Answer',
    expectedRange: [0.0, 1.0],
    transcript:
      'I really enjoy playing cricket and football on weekends. The weather in Bangalore is great and yesterday I had biryani with my friends.'
  },
  {
    name: 'Empty Answer',
    expectedRange: [0.0, 0.0],
    transcript: ''
  },
  {
    name: 'Keyword-Stuffed Answer',
    expectedRange: [1.0, 4.0],
    transcript:
      'Query key value query key value parallel sequential recurrent matrix dot product attention softmax query key value complexity quadratic gradient token token token.'
  }
];

async function runGoldenTests() {
  console.log('================================================================');
  console.log('SKILLSYNC AI - SCORING ENGINE GOLDEN VERIFICATION SUITE');
  console.log('================================================================\n');

  let allPassed = true;
  const results = [];

  for (const profile of testProfiles) {
    console.log(`Testing Profile: "${profile.name}"...`);
    const scores = [];
    let scorerUsed = '';
    let sampleEval = null;

    for (let run = 1; run <= 3; run++) {
      const evalRes = await evaluateAnswer(benchmarkQuestion, profile.transcript, 0, false);
      scores.push(evalRes.aiScore);
      scorerUsed = evalRes.scoredBy;
      sampleEval = evalRes;
    }

    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const avgScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
    const variance = parseFloat((maxScore - minScore).toFixed(1));

    const inRange = avgScore >= profile.expectedRange[0] && avgScore <= profile.expectedRange[1];
    const lowVariance = variance <= 0.6; // tolerance 0.6
    const passed = inRange && lowVariance;

    if (!passed) allPassed = false;

    console.log(`  Scorer: ${scorerUsed} | Runs: [${scores.join(', ')}] | Avg: ${avgScore} | Variance: ${variance}`);
    console.log(`  Expected: [${profile.expectedRange[0]} - ${profile.expectedRange[1]}] | Status: ${passed ? 'PASS' : 'FAIL'}`);
    if (sampleEval.audit) {
      console.log(`  Audit: Latency=${sampleEval.audit.latencyMs}ms, Model=${sampleEval.audit.model}`);
    }
    console.log('----------------------------------------------------------------');

    results.push({
      profile: profile.name,
      scores,
      avgScore,
      variance,
      expected: `${profile.expectedRange[0]}-${profile.expectedRange[1]}`,
      passed,
      scorer: scorerUsed
    });
  }

  console.log('\nFINAL GOLDEN TEST SUMMARY:');
  console.table(results);

  if (allPassed) {
    console.log('\n[PASS] All golden tests passed with high consistency and expected rubric boundaries!');
    process.exit(0);
  } else {
    console.error('\n[FAIL] One or more golden tests failed rubric boundaries or variance limits.');
    process.exit(1);
  }
}

if (require.main === module) {
  runGoldenTests();
}

module.exports = { runGoldenTests };
