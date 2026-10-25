#!/usr/bin/env node
// Case zh-shanghai-offer: CNY/RMB currency plus sane salary ordering.
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
const base = (data.marketAnalysis && data.marketAnalysis.baseSalary) || {};
const currency = String(base.currency || '').toUpperCase();
if (!/CNY|RMB|人民币|CN¥|¥/.test(currency) && !/人民币|元/.test(String(base.currency || ''))) {
  problems.push(`currency should be CNY/RMB, got ${JSON.stringify(base.currency)}`);
}
for (const key of ['min', 'median', 'max']) {
  if (typeof base[key] !== 'number') problems.push(`baseSalary.${key} must be a number`);
}
if (
  typeof base.min === 'number' &&
  typeof base.median === 'number' &&
  typeof base.max === 'number' &&
  !(base.min < base.median && base.median < base.max)
) {
  problems.push(`baseSalary must be ascending: ${base.min}, ${base.median}, ${base.max}`);
}
const target = (data.negotiation && data.negotiation.targetRange) || {};
for (const key of ['min', 'target', 'stretch']) {
  if (typeof target[key] !== 'number') problems.push(`negotiation.targetRange.${key} must be a number`);
}
if (!data.negotiation || !Array.isArray(data.negotiation.talkingPoints) || data.negotiation.talkingPoints.length === 0) {
  problems.push('negotiation.talkingPoints must not be empty');
}
if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) {
  problems.push('recommendations must not be empty');
}
if (!data.benefits || !Array.isArray(data.benefits.standard)) {
  problems.push('benefits.standard missing');
}

if (problems.length) {
  console.log(`FAIL: ${problems.join('; ')}`);
  process.exit(1);
}
console.log('PASS: CNY salary analysis with ascending ranges');
