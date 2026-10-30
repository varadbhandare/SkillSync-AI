/**
 * SkillSync AI - Question Bank Generator Script
 * Uses Google GenAI (gemini-2.5-flash) to generate high-quality benchmark interview questions
 * for human review and inclusion into seed/questionBank/ JSON catalogs.
 *
 * Usage:
 *   node scripts/generateQuestionBank.js --role ai_ml --difficulty Medium --count 3 --topic "Transformers & Attention" --output scratch/new_questions.json
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

// Schema for generated questions
const QuestionConditionSchema = z.object({
  name: z.string().min(5),
  keywords: z.array(z.string().min(1)).min(3),
  maxPoints: z.number().min(1).max(5)
});

const GeneratedQuestionSchema = z.object({
  role: z.string(),
  topic: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  text: z.string().min(20),
  idealAnswer: z.string().min(50),
  conditions: z.array(QuestionConditionSchema).min(3).max(4),
  timeLimitSec: z.number()
});

const BatchSchema = z.array(GeneratedQuestionSchema);

// Parse CLI args
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    role: 'fullstack',
    difficulty: 'Medium',
    count: 3,
    topic: 'Distributed Systems & Microservices',
    output: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--role' && args[i + 1]) params.role = args[++i];
    else if (args[i] === '--difficulty' && args[i + 1]) params.difficulty = args[++i];
    else if (args[i] === '--count' && args[i + 1]) params.count = parseInt(args[++i], 10);
    else if (args[i] === '--topic' && args[i + 1]) params.topic = args[++i];
    else if (args[i] === '--output' && args[i + 1]) params.output = args[++i];
  }

  return params;
}

async function generateQuestions() {
  const params = parseArgs();
  console.log(`[Question Generator] Starting generation: ${params.count} questions for role=${params.role}, difficulty=${params.difficulty}, topic="${params.topic}"`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Error] GEMINI_API_KEY environment variable is missing.');
    process.exit(1);
  }

  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const timeLimit = params.difficulty === 'Easy' ? 90 : params.difficulty === 'Medium' ? 120 : 180;

  const prompt = `Generate exactly ${params.count} unique, high-yield technical interview questions for a candidate targeting role "${params.role}".
Topic: "${params.topic}"
Difficulty Level: "${params.difficulty}"

Each question must strictly satisfy these requirements:
1. "role": "${params.role}"
2. "topic": "${params.topic}"
3. "difficulty": "${params.difficulty}"
4. "text": Professional, clear technical interview question testing real-world software engineering depth.
5. "idealAnswer": Comprehensive, 2-4 sentence reference answer covering key principles, trade-offs, and algorithmic or architectural considerations.
6. "conditions": An array of 3 or 4 distinct rubric checkpoints. Each condition has:
   - "name": Concise title of the checkpoint
   - "keywords": 4 to 8 essential lower-case technical keywords or terms indicative of understanding
   - "maxPoints": Number between 2.0 and 4.0. The sum of maxPoints for ALL conditions in a question MUST EQUAL EXACTLY 10.0 (e.g. 3.5 + 3.5 + 3.0 = 10.0, or 2.5 + 2.5 + 2.5 + 2.5 = 10.0).
7. "timeLimitSec": ${timeLimit}

Output a single valid JSON array of question objects matching this schema with no markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text ? response.text.trim() : '';
    const cleanJson = rawText.replace(/^```json\s*|^```\s*|```$/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const validated = BatchSchema.parse(parsed);

    // Verify condition points sum to 10.0
    for (const q of validated) {
      const sum = q.conditions.reduce((acc, c) => acc + c.maxPoints, 0);
      if (Math.abs(sum - 10.0) > 0.05) {
        console.warn(`[Warning] Question conditions do not sum to 10.0 (got ${sum}). Normalizing...`);
        // normalize proportionally
        const ratio = 10.0 / sum;
        q.conditions.forEach((c) => {
          c.maxPoints = parseFloat((c.maxPoints * ratio).toFixed(1));
        });
      }
    }

    console.log(`[Success] Generated and validated ${validated.length} questions.`);

    if (params.output) {
      const targetPath = path.isAbsolute(params.output) ? params.output : path.join(process.cwd(), params.output);
      fs.writeFileSync(targetPath, JSON.stringify(validated, null, 2), 'utf8');
      console.log(`[Saved] Wrote generated questions to ${targetPath}`);
    } else {
      console.log('\nGenerated Questions JSON:\n');
      console.log(JSON.stringify(validated, null, 2));
    }
  } catch (err) {
    console.error('[Error] Generation failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  generateQuestions();
}

module.exports = { generateQuestions };
