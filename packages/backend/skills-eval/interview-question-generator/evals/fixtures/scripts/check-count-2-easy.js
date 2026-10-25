#!/usr/bin/env node
// Case en-easy-two: exactly 2 questions, every question rated easy.
const raw = process.env.EVAL_FINAL_MESSAGE || '';
const start = raw.indexOf('{');
const end = raw.lastIndexOf('}');
if (start === -1 || end <= start) {
  console.log('FAIL: final message is not a JSON object');
  process.exit(1);
}
let data;
try {
  data = JSON.parse(raw.slice(start, end + 1));
} catch (err) {
  console.log(`FAIL: invalid JSON: ${err.message}`);
  process.exit(1);
}

const problems = [];
const questions = Array.isArray(data.questions) ? data.questions : [];
if (questions.length !== 2) problems.push(`expected 2 questions, got ${questions.length}`);
questions.forEach((q, i) => {
  if (!q || typeof q !== 'object') {
    problems.push(`questions[${i}] is not an object`);
    return;
  }
  if (!String(q.question || '').trim()) problems.push(`questions[${i}].question is empty`);
  if (q.difficulty !== 'easy') problems.push(`questions[${i}].difficulty is ${q.difficulty}, expected easy`);
});

if (problems.length) {
  console.log(`FAIL: ${problems.join('; ')}`);
  process.exit(1);
}
console.log('PASS: exactly 2 easy questions');
