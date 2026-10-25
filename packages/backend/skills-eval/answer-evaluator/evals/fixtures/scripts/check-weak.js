#!/usr/bin/env node
// Case en-weak-answer: vague answers must score <= 75 with actionable improvements.
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
const score = data.overallScore;
if (typeof score !== 'number' || Number.isNaN(score)) problems.push('overallScore must be a number');
else if (score > 75) problems.push(`overallScore ${score} is too high for a vague answer`);
if (!['C', 'D', 'F'].includes(data.grade)) problems.push(`grade ${data.grade} should be C/D/F`);
if (!data.feedback || !Array.isArray(data.feedback.improvements) || data.feedback.improvements.length === 0) {
  problems.push('feedback.improvements must not be empty');
}
if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) {
  problems.push('recommendations must not be empty');
}

if (problems.length) {
  console.log(`FAIL: ${problems.join('; ')}`);
  process.exit(1);
}
console.log(`PASS: weak answer scored ${score} with grade ${data.grade}`);
