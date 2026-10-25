#!/usr/bin/env node
// Mirrors SCORING.achievements.pattern in resume-ai.service.ts.
// Keep this regex in sync when the production metric rule changes.
const METRIC =
  /(?:\d+(?:\.\d+)?\s*(?:%|％|倍|万|亿|人|次|条|项|个|家|天|小时|元|美元)|[$¥￥]\s*\d|\d+\s*[xX]\b|\d[\d,]*\s*(?:users?|customers?|clients?|projects?|team members?|cases?|orders?|hours?|days?))/i;

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

const experience = Array.isArray(data.experience) ? data.experience : [];
const texts = experience
  .flatMap((exp) => [
    ...(Array.isArray(exp.achievements) ? exp.achievements : []),
    ...(Array.isArray(exp.description) ? exp.description : []),
  ])
  .filter((item) => typeof item === 'string');

const hit = texts.find((text) => METRIC.test(text));

if (!hit) {
  console.log('FAIL: no quantified metric found in achievements or description');
  process.exit(1);
}

console.log(`PASS: quantified metric preserved -> ${hit}`);
