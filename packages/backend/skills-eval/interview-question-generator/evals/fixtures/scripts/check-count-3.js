#!/usr/bin/env node
// Case zh-count-three: exactly 3 questions, categories counters sum to 3.
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
if (questions.length !== 3) problems.push(`expected 3 questions, got ${questions.length}`);
questions.forEach((q, i) => {
  if (!q || typeof q !== 'object') {
    problems.push(`questions[${i}] is not an object`);
    return;
  }
  if (!String(q.question || '').trim()) problems.push(`questions[${i}].question is empty`);
  if (!['behavioral', 'technical', 'situational', 'experience'].includes(q.category)) {
    problems.push(`questions[${i}].category invalid: ${q.category}`);
  }
});
const categories = data.categories || {};
const total = ['behavioral', 'technical', 'situational', 'experience'].reduce(
  (sum, key) => sum + (typeof categories[key] === 'number' ? categories[key] : 0),
  0,
);
if (total !== 3) problems.push(`categories sum is ${total}, expected 3`);

if (problems.length) {
  console.log(`FAIL: ${problems.join('; ')}`);
  process.exit(1);
}
console.log('PASS: exactly 3 questions with consistent category counters');
