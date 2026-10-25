#!/usr/bin/env node
// Case zh-strong-answer: strong answers must score >= 70 and grade A/B.
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
else if (score < 70) problems.push(`overallScore ${score} is too low for a strong answer`);
if (!['A', 'B'].includes(data.grade)) problems.push(`grade ${data.grade} should be A or B`);
for (const key of ['content', 'communication', 'problemSolving']) {
  const block = data.breakdown && data.breakdown[key];
  if (!block || typeof block.score !== 'number') problems.push(`breakdown.${key}.score missing`);
}
if (!data.feedback || !Array.isArray(data.feedback.positive) || data.feedback.positive.length === 0) {
  problems.push('feedback.positive must not be empty');
}
if (!data.sampleAnswer || !String(data.sampleAnswer.improved || '').trim()) {
  problems.push('sampleAnswer.improved is empty');
}
if (!Array.isArray(data.followUpQuestions) || data.followUpQuestions.length === 0) {
  problems.push('followUpQuestions must not be empty');
}

if (problems.length) {
  console.log(`FAIL: ${problems.join('; ')}`);
  process.exit(1);
}
console.log(`PASS: strong answer scored ${score} with grade ${data.grade}`);
