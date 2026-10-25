#!/usr/bin/env node
// Structural regression for the answer-evaluator skill output.
const SPEC = {
  "required": [
    "overallScore",
    "grade",
    "breakdown",
    "feedback",
    "sampleAnswer",
    "followUpQuestions",
    "recommendations"
  ],
  "numbers": [
    "overallScore",
    "breakdown.content.score",
    "breakdown.communication.score",
    "breakdown.problemSolving.score"
  ],
  "enums": {
    "grade": [
      "A",
      "B",
      "C",
      "D",
      "F"
    ]
  },
  "objectFields": {
    "breakdown": [
      "content",
      "communication",
      "problemSolving"
    ],
    "breakdown.content": [
      "score",
      "strengths",
      "weaknesses"
    ],
    "feedback": [
      "positive",
      "improvements",
      "redFlags"
    ],
    "sampleAnswer": [
      "improved",
      "keyAdditions"
    ]
  },
  "nonEmpty": [
    "followUpQuestions",
    "recommendations"
  ],
  "stringArrays": [
    "feedback.positive",
    "feedback.improvements",
    "followUpQuestions"
  ],
  "ranges": {
    "overallScore": [
      0,
      100
    ]
  }
};

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

const get = (obj, pathStr) =>
  pathStr.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
const isPresent = (value) => value !== undefined && value !== null && value !== '';
const problems = [];

for (const key of SPEC.required || []) {
  if (!isPresent(get(data, key))) problems.push(`missing "${key}"`);
}
for (const key of SPEC.nonEmptyStrings || []) {
  const value = get(data, key);
  if (!isPresent(value) || typeof value !== 'string' || !value.trim()) problems.push(`"${key}" must be a non-empty string`);
}
for (const key of SPEC.nonEmpty || []) {
  const value = get(data, key);
  if (!Array.isArray(value) || value.length === 0) problems.push(`"${key}" must be a non-empty array`);
}
for (const key of SPEC.stringArrays || []) {
  const value = get(data, key);
  if (!Array.isArray(value)) {
    problems.push(`"${key}" must be an array`);
    continue;
  }
  if (value.some((item) => typeof item !== 'string' || !item.trim())) {
    problems.push(`"${key}" must contain non-empty strings`);
  }
}
for (const [key, min] of Object.entries(SPEC.minLen || {})) {
  const value = get(data, key);
  if (!Array.isArray(value) || value.length < min) problems.push(`"${key}" needs at least ${min} entries`);
}
for (const key of SPEC.numbers || []) {
  const value = get(data, key);
  if (typeof value !== 'number' || Number.isNaN(value)) problems.push(`"${key}" must be a number`);
}
for (const [key, allowed] of Object.entries(SPEC.enums || {})) {
  const value = get(data, key);
  if (!isPresent(value)) continue;
  if (!allowed.includes(value)) problems.push(`"${key}" must be one of ${allowed.join(', ')} (got ${JSON.stringify(value)})`);
}
for (const [key, fields] of Object.entries(SPEC.objectFields || {})) {
  const value = get(data, key);
  if (!value || typeof value !== 'object') {
    problems.push(`"${key}" must be an object`);
    continue;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        problems.push(`"${key}[${index}]" must be an object`);
        return;
      }
      for (const field of fields) {
        if (!isPresent(item[field])) problems.push(`"${key}[${index}].${field}" is empty`);
      }
    });
  } else {
    for (const field of fields) {
      if (!isPresent(value[field])) problems.push(`"${key}.${field}" is empty`);
    }
  }
}
for (const [key, config] of Object.entries(SPEC.enumArray || {})) {
  const items = get(data, key);
  if (!Array.isArray(items)) continue;
  items.forEach((item, index) => {
    if (!item || !config.values.includes(item[config.field])) {
      problems.push(`"${key}[${index}].${config.field}" must be one of ${config.values.join(', ')}`);
    }
  });
}
for (const [key, config] of Object.entries(SPEC.enumArray2 || {})) {
  const items = get(data, key);
  if (!Array.isArray(items)) continue;
  items.forEach((item, index) => {
    if (!item || !config.values.includes(item[config.field])) {
      problems.push(`"${key}[${index}].${config.field}" must be one of ${config.values.join(', ')}`);
    }
  });
}
for (const [key, [min, max]] of Object.entries(SPEC.ranges || {})) {
  const value = get(data, key);
  if (typeof value === 'number' && (value < min || value > max)) problems.push(`"${key}" must be within [${min}, ${max}] (got ${value})`);
}
for (const group of SPEC.ordered || []) {
  const values = group.map((key) => get(data, key));
  if (values.every((value) => typeof value === 'number') && !(values[0] < values[1] && values[1] < values[2])) {
    problems.push(`expected ascending order for ${group.join(' < ')} (got ${values.join(', ')})`);
  }
}

const serialized = JSON.stringify(data);
if (/"not provided"|"N\/A"|"TBD"/i.test(serialized)) problems.push('contains placeholder values');

if (problems.length > 0) {
  console.log(`FAIL: ${problems.slice(0, 12).join('; ')}`);
  process.exit(1);
}
console.log('PASS: output matches the expected schema shape');
