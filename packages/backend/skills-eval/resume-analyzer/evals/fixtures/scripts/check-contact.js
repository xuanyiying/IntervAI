#!/usr/bin/env node
// Mirrors the production rule in resume-ai.service.ts:
// contact is complete when BOTH email and phone are present; location is optional.
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

const pi = data.personalInfo || {};
const email = String(pi.email || '').trim();
const phone = String(pi.phone || '').trim();

if (!email || !phone) {
  console.log(`FAIL: contact incomplete (email="${email}", phone="${phone}")`);
  process.exit(1);
}

console.log(`PASS: email=${email}, phone=${phone}`);
