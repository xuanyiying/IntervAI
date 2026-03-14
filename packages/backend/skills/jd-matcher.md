---
name: jd-matcher
version: 1.0.0
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

## Output Format

```json
{
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
