const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const htmlPath = path.resolve(__dirname, '../../../skillsync-ai-frontend/skillsync-ai-frontend/index.html');
if (!fs.existsSync(htmlPath)) {
  console.error(`HTML file not found at: ${htmlPath}`);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Known browser & library globals
const BROWSER_GLOBALS = new Set([
  'window', 'document', 'console', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage',
  'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'alert', 'confirm', 'prompt', 'AudioContext', 'webkitAudioContext', 'SpeechRecognition', 'webkitSpeechRecognition',
  'MediaStream', 'TextDecoder', 'TextEncoder', 'ReadableStream', 'AbortController', 'Event', 'CustomEvent',
  'URL', 'URLSearchParams', 'FormData', 'Blob', 'File', 'FileReader', 'Image',
  'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Error', 'Promise', 'Map', 'Set',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'escape', 'unescape',
  'Chart', 'marked', 'DOMPurify', 'hljs', 'cocoSsd', 'tf',
  'event', 'this'
]);

// 1. Extract and parse all inline <script> blocks
const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
let scriptMatch;
const declaredTopLevel = new Set();
let scriptCount = 0;

while ((scriptMatch = scriptRegex.exec(html)) !== null) {
  scriptCount++;
  const scriptContent = scriptMatch[1];
  try {
    const ast = acorn.parse(scriptContent, { ecmaVersion: 'latest', sourceType: 'script' });
    walk.simple(ast, {
      FunctionDeclaration(node) {
        if (node.id && node.id.name) declaredTopLevel.add(node.id.name);
      },
      VariableDeclaration(node) {
        node.declarations.forEach(decl => {
          if (decl.id && decl.id.name) declaredTopLevel.add(decl.id.name);
        });
      },
      AssignmentExpression(node) {
        if (node.left.type === 'MemberExpression' && node.left.object.type === 'Identifier' && node.left.object.name === 'window') {
          if (node.left.property.type === 'Identifier') declaredTopLevel.add(node.left.property.name);
        }
      }
    });
  } catch (err) {
    console.error(`Syntax error parsing inline script #${scriptCount}:`, err.message);
    process.exit(1);
  }
}

console.log(`[check-frontend] Parsed ${scriptCount} inline <script> blocks.`);
console.log(`[check-frontend] Found ${declaredTopLevel.size} top-level declarations.`);

// 2. Extract and inspect all inline on* attributes (handling matching quotes)
const handlerRegex = /\b(on[a-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
let m;
const handlers = [];
const missingIdentifiers = [];

while ((m = handlerRegex.exec(html)) !== null) {
  const attrName = m[1];
  const code = (m[2] !== undefined ? m[2] : m[3]).trim();
  handlers.push({ attr: attrName, code });

  try {
    const wrapperAst = acorn.parse(`(function(event) { ${code}; })`, { ecmaVersion: 'latest' });
    walk.simple(wrapperAst, {
      CallExpression(node) {
        let calleeName = null;
        if (node.callee.type === 'Identifier') {
          calleeName = node.callee.name;
        } else if (node.callee.type === 'MemberExpression' && node.callee.object.type === 'Identifier') {
          const objName = node.callee.object.name;
          if (!declaredTopLevel.has(objName) && !BROWSER_GLOBALS.has(objName)) {
            missingIdentifiers.push({ attr: attrName, code, identifier: objName, type: 'Object' });
          }
          return;
        }
        if (calleeName) {
          if (!declaredTopLevel.has(calleeName) && !BROWSER_GLOBALS.has(calleeName)) {
            missingIdentifiers.push({ attr: attrName, code, identifier: calleeName, type: 'Function' });
          }
        }
      }
    });
  } catch (err) {
    if (!code.includes('${')) {
      console.warn(`[check-frontend] Warning: Could not parse inline handler [${attrName}="${code}"]:`, err.message);
    }
  }
}

console.log(`[check-frontend] Inspected ${handlers.length} inline event handlers.`);

// 3. Verify Required Internal Functions
const REQUIRED_INTERNAL_FUNCTIONS = [
  'activateHardwareStream',
  'startAudioNoiseMonitor',
  'startVideoMotionAnalysis',
  'stopInterviewSession',
  'renderInterviewPhase',
  'setInterviewPhase',
  'grantStep1DevicePermissions',
  'activateFullscreenAndStartInterview',
  'initBackendInterviewSession',
  'loadAndStartCocoDetector',
  'startSpeechRecognition',
  'changeSpeechLanguage',
  'evaluateInterviewAnswer',
  'nextInterviewQuestion',
  'completeAndConcludeInterview',
  'resetAndRestartInterview',
  'handleProctoringViolation',
  'toggleNotifications',
  'handleLoginSubmit',
  'handleRegisterSubmit',
  'triggerSimulationWarning',
  'initMentorModule',
  'handleChatSubmit',
  'regenerateMentorMessage',
  'submitMentorFeedback',
  'copyMentorMessage'
];

const missingInternalFunctions = [];
for (const fn of REQUIRED_INTERNAL_FUNCTIONS) {
  if (!declaredTopLevel.has(fn)) {
    missingInternalFunctions.push(fn);
  }
}

// 4. Verify Critical DOM Elements
const REQUIRED_DOM_ELEMENTS = [
  'fullscreenPromptModal',
  'interviewLockedCard',
  'interviewActiveArea',
  'interviewReportCard',
  'interviewTerminatedCard',
  'interviewVideo',
  'modalCamDeviceSelect',
  'modalMicDeviceSelect',
  'modalAudioLevelBar',
  'modalDeclareHeadset',
  'modalIntegrityConsent',
  'perQuestionTimer',
  'sessionTotalTimer',
  'interview25Segments',
  'speechLangSelect',
  'reportWeightedScore',
  'reportIntegrityRating',
  'reportViolationsCount',
  'reportQuestionsCount'
];

const missingDomElements = [];
for (const id of REQUIRED_DOM_ELEMENTS) {
  if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
    missingDomElements.push(id);
  }
}

// 5. Consolidated Report
let hasError = false;

if (missingIdentifiers.length > 0) {
  hasError = true;
  console.error('\n❌ [check-frontend] Undefined inline handler identifiers:');
  console.table(missingIdentifiers);
}

if (missingInternalFunctions.length > 0) {
  hasError = true;
  console.error('\n❌ [check-frontend] Missing required internal functions:');
  console.table(missingInternalFunctions.map(fn => ({ functionName: fn, status: 'MISSING' })));
}

if (missingDomElements.length > 0) {
  hasError = true;
  console.error('\n❌ [check-frontend] Missing required DOM elements:');
  console.table(missingDomElements.map(id => ({ elementId: id, status: 'MISSING' })));
}

if (hasError) {
  process.exit(1);
} else {
  console.log('\n✅ [check-frontend] ALL CHECKS PASSED: 0 undefined handlers, all required functions declared, all required DOM elements present.');
  process.exit(0);
}
