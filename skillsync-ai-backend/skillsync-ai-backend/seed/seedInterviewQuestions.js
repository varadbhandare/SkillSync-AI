const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const InterviewQuestion = require('../models/InterviewQuestion');

dotenv.config();

const QUESTION_BANK_DIR = path.join(__dirname, 'questionBank');

function loadAllQuestionsFromBank() {
  if (!fs.existsSync(QUESTION_BANK_DIR)) {
    throw new Error(`Question bank directory not found at ${QUESTION_BANK_DIR}`);
  }

  const files = fs.readdirSync(QUESTION_BANK_DIR).filter((f) => f.endsWith('.json'));
  const allQuestions = [];

  for (const file of files) {
    const filePath = path.join(QUESTION_BANK_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const inferredRole = path.basename(file, '.json');
    let questions;
    try {
      questions = JSON.parse(content);
    } catch (parseErr) {
      throw new Error(`Failed to parse JSON file ${file}: ${parseErr.message}`);
    }

    if (!Array.isArray(questions)) {
      throw new Error(`Expected an array of questions in ${file}`);
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.role) {
        q.role = inferredRole;
      }

      if (!q.text || !q.difficulty || !q.idealAnswer || !Array.isArray(q.conditions)) {
        throw new Error(`Invalid question format in ${file} at index ${i}: "${q.text || 'missing text'}"`);
      }

      // Check condition max points sum
      const condSum = q.conditions.reduce((acc, c) => acc + (c.maxPoints || 0), 0);
      if (Math.abs(condSum - 10.0) > 0.05) {
        throw new Error(
          `Condition points in ${file} index ${i} do not sum to 10.0 (got ${condSum}): "${q.text.substring(0, 40)}..."`
        );
      }

      // Set default timeLimitSec if missing
      if (!q.timeLimitSec) {
        q.timeLimitSec = q.difficulty === 'Easy' ? 90 : q.difficulty === 'Medium' ? 120 : 180;
      }
      q.isActive = q.isActive !== false;

      allQuestions.push(q);
    }
  }

  return allQuestions;
}

async function seedQuestions() {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB. Seeding Interview Questions from questionBank...');

    const questions = loadAllQuestionsFromBank();
    console.log(`[Seed] Loaded ${questions.length} questions from questionBank directory.`);

    let upsertedCount = 0;
    for (const q of questions) {
      await InterviewQuestion.findOneAndUpdate(
        { text: q.text },
        { $set: q },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upsertedCount++;
    }

    const totalActive = await InterviewQuestion.countDocuments({ isActive: true });
    console.log(`[Seed] Successfully seeded ${upsertedCount} questions. Total active in DB: ${totalActive}`);

    // Aggregate statistics by role and difficulty
    const stats = await InterviewQuestion.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { role: '$role', difficulty: '$difficulty' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.role': 1, '_id.difficulty': 1 } }
    ]);

    console.log('\n[Seed] Breakdown by Role and Difficulty:');
    const table = {};
    for (const item of stats) {
      const role = item._id.role;
      const diff = item._id.difficulty;
      if (!table[role]) table[role] = { Easy: 0, Medium: 0, Hard: 0, Total: 0 };
      table[role][diff] = item.count;
      table[role].Total += item.count;
    }
    console.table(table);

    if (require.main === module) {
      process.exit(0);
    }
    return { upsertedCount, totalActive, stats };
  } catch (err) {
    console.error('[Seed Error] Failed to seed interview questions:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
}

if (require.main === module) {
  seedQuestions();
}

module.exports = { seedQuestions, loadAllQuestionsFromBank };
