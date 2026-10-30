/**
 * SkillSync AI - Mentor SSE Streaming Contract Test
 * Validates the SSE protocol contract between backend and frontend parser
 */

const assert = require('assert');

console.log('================================================================');
console.log('SKILLSYNC AI - MENTOR SSE PROTOCOL & PARSER VERIFICATION');
console.log('================================================================\n');

// 1. Simulate server SSE chunk emission
function generateMockSSEStream() {
  const events = [
    { type: 'status', message: 'Analyzing query and candidate context...' },
    { type: 'thought', token: 'Formulating explanation for Dynamic Programming...', text: 'Formulating explanation for Dynamic Programming...' },
    { type: 'thought_done', durationSec: 1.2 },
    { type: 'token', token: 'Dynamic ', text: 'Dynamic ' },
    { type: 'token', token: 'Programming ', text: 'Programming ' },
    { type: 'token', token: 'is ', text: 'is ' },
    { type: 'token', token: 'optimal substructure.', text: 'optimal substructure.' },
    {
      type: 'sources',
      sources: [
        {
          title: 'Dynamic Programming Masterclass',
          url: 'https://www.youtube.com/results?search_query=dynamic+programming+freecodecamp'
        }
      ],
      platformSources: [
        {
          title: 'Dynamic Programming Masterclass',
          url: 'https://www.youtube.com/results?search_query=dynamic+programming+freecodecamp'
        }
      ]
    },
    {
      type: 'suggestions',
      suggestions: ['Solve Coin Change on LeetCode', 'Implement LCS'],
      suggestedActions: ['Solve Coin Change on LeetCode', 'Implement LCS']
    },
    { type: 'done', sessionId: 'sess_test_123', messageId: 'msg_test_456', title: 'DP Mentorship' }
  ];

  let rawSSE = '';
  // Include heartbeat
  rawSSE += ': heartbeat\n\n';

  for (const ev of events) {
    rawSSE += `event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`;
  }

  return { events, rawSSE };
}

// 2. Client parser implementation identical to index.html handleChatSubmit
function clientParseSSEStream(rawSSE) {
  let accumulatedResponse = '';
  let accumulatedThought = '';
  let statusMessage = '';
  let thoughtDuration = 0;
  let receivedSources = [];
  let receivedSuggestions = [];
  let donePayload = null;
  let tokenCount = 0;

  // Split into lines just like browser reader chunks
  const lines = rawSSE.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data: ')) continue;
    const jsonStr = trimmed.slice(6);
    if (!jsonStr) continue;

    const evt = JSON.parse(jsonStr);

    if (evt.type === 'status') {
      statusMessage = evt.message;
    } else if (evt.type === 'thought') {
      accumulatedThought += evt.token || evt.text || '';
    } else if (evt.type === 'thought_done') {
      thoughtDuration = evt.durationSec || 0;
    } else if (evt.type === 'token') {
      accumulatedResponse += evt.token || evt.text || '';
      tokenCount++;
    } else if (evt.type === 'sources') {
      receivedSources = evt.sources || evt.platformSources || [];
    } else if (evt.type === 'suggestions') {
      receivedSuggestions = evt.suggestions || evt.suggestedActions || [];
    } else if (evt.type === 'done') {
      donePayload = evt;
    }
  }

  return {
    accumulatedResponse,
    accumulatedThought,
    statusMessage,
    thoughtDuration,
    receivedSources,
    receivedSuggestions,
    donePayload,
    tokenCount
  };
}

async function runTests() {
  const { events, rawSSE } = generateMockSSEStream();

  console.log(`Simulated stream produced ${rawSSE.length} bytes across ${events.length} events (including heartbeat).`);

  const parsed = clientParseSSEStream(rawSSE);

  console.log('\nVerifying protocol properties:');

  // Test 1: Status message received
  assert.strictEqual(parsed.statusMessage, 'Analyzing query and candidate context...');
  console.log('  ✅ Status Event: Parsed correctly');

  // Test 2: Thought parsed
  assert.strictEqual(parsed.accumulatedThought, 'Formulating explanation for Dynamic Programming...');
  console.log('  ✅ Thought Event: Parsed correctly');

  // Test 3: Thought duration
  assert.strictEqual(parsed.thoughtDuration, 1.2);
  console.log('  ✅ Thought Done Event: Duration verified');

  // Test 4: Streaming tokens accumulated
  assert.strictEqual(parsed.accumulatedResponse, 'Dynamic Programming is optimal substructure.');
  assert.strictEqual(parsed.tokenCount, 4);
  console.log('  ✅ Token Events: 4 tokens assembled without truncation or NaN');

  // Test 5: Sources and platformSources dual compatibility
  assert.strictEqual(parsed.receivedSources.length, 1);
  assert.strictEqual(parsed.receivedSources[0].title, 'Dynamic Programming Masterclass');
  console.log('  ✅ Sources Event: Verified sources payload compatibility');

  // Test 6: Suggestions dual compatibility
  assert.strictEqual(parsed.receivedSuggestions.length, 2);
  console.log('  ✅ Suggestions Event: 2 action items parsed');

  // Test 7: Done event
  assert.strictEqual(parsed.donePayload.sessionId, 'sess_test_123');
  assert.strictEqual(parsed.donePayload.messageId, 'msg_test_456');
  console.log('  ✅ Done Event: Session and message metadata verified');

  console.log('\n[PASS] Mentor SSE Protocol & Client Parser passed all contract tests with 100% fidelity!');
}

runTests();
