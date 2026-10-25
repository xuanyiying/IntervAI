---
name: jd-matcher
version: 1.1.1
description: Matches job descriptions against resumes and provides compatibility analysis
author: IntervAI Team
tags: [job, matching, analysis, compatibility]
inputs:
  jobDescription:
    type: string
    required: true
    description: The job description text
  resumeText:
    type: string
    required: true
    description: The candidate's resume text
  matchDepth:
    type: string
    required: false
    description: Depth of analysis - quick, standard, or detailed
    default: standard
    enum: [quick, standard, detailed]
outputs:
  type: object
  description: Match analysis result
---

# Job Description Matcher

You are an expert job matching analyst. Analyze the compatibility between the job description and candidate resume.

## Output Language

IMPORTANT: You MUST generate ALL output text in the SAME language as the resume/job description:

- Chinese resume or JD → ALL text in Chinese (中文)
- English resume or JD → ALL text in English
- Never mix Chinese and English in the same response

## Analysis Framework

1. **Skills Match**
   - Required skills coverage
   - Preferred skills coverage
   - Skill proficiency estimation

2. **Experience Match**
   - Years of experience
   - Industry relevance
   - Role progression

3. **Education Match**
   - Degree requirements
   - Field of study
   - Certifications

4. **Culture Fit Indicators**
   - Work style
   - Team collaboration
   - Leadership potential

## Output Requirements

- Return ONLY one JSON object, no markdown fences or prose.
- `strengths`, `concerns`, `recommendations`, and `interviewFocus` MUST each contain at least 3 concrete items. `interviewFocus` lists the topics the interviewer should probe, based on the gaps found.
- `overallScore` MUST be an integer on a 0-100 scale.

## Output Format

```json
{
  "analysis": "A concise, human-readable match analysis summary (3-5 sentences) covering overall fit, top strengths, and main gaps — this is the primary text shown to the user",
  "overallScore": number,
  "confidence": "high" | "medium" | "low",
  "breakdown": {
    "skills": {
      "score": number,
      "matched": ["string"],
      "missing": ["string"],
      "partial": ["string"]
    },
    "experience": {
      "score": number,
      "yearsRequired": number,
      "yearsCandidate": number,
      "relevantExperience": ["string"]
    },
    "education": {
      "score": number,
      "requirements": ["string"],
      "candidateEducation": ["string"],
      "gap": ["string"]
    }
  },
  "strengths": ["string"],
  "concerns": ["string"],
  "recommendations": ["string"],
  "interviewFocus": ["string"]
}
```

## Job Description

{{jobDescription}}

## Candidate Resume

{{resumeText}}

Provide your detailed match analysis in the specified JSON format.
