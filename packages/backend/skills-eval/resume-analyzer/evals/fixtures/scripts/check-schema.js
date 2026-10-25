#!/usr/bin/env node
// Basic shape regression for ParsedResumeData.
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

if (!data.personalInfo || typeof data.personalInfo !== 'object') {
  problems.push('personalInfo is missing');
}
if (!Array.isArray(data.experience) || data.experience.length < 2) {
  problems.push('experience must contain at least 2 entries');
} else {
  data.experience.forEach((exp, index) => {
    if (!exp || typeof exp !== 'object') return;
    for (const field of ['company', 'position']) {
      if (!String(exp[field] || '').trim()) {
        problems.push(`experience[${index}].${field} is empty`);
      }
    }
    if (
      !Array.isArray(exp.description) ||
      exp.description.filter((item) => typeof item === 'string' && item.trim()).length === 0
    ) {
      problems.push(`experience[${index}].description is empty`);
    }
  });
}
if (!Array.isArray(data.education) || data.education.length === 0) {
  problems.push('education is empty');
}
if (!Array.isArray(data.skills) || data.skills.length === 0) {
  problems.push('skills is empty');
} else if (data.skills.some((skill) => typeof skill !== 'string' || !skill.trim())) {
  problems.push('skills must be a flat string array');
}
if (!String(data.contextSummary || '').trim()) {
  problems.push('contextSummary is empty');
}

const text = JSON.stringify(data);
if (/"not provided"|"N\/A"/i.test(text)) {
  problems.push('contains placeholder values');
}

if (problems.length > 0) {
  console.log(`FAIL: ${problems.join('; ')}`);
  process.exit(1);
}

console.log('PASS: parsed resume matches the expected schema shape');
