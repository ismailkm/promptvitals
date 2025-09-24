// src/lib/config/keywords/commonLists.ts

import { PatternWithMetadata } from '@/lib/types/patterns';
import { SeverityLevel } from '@/lib/types/shared';

/**
 * This file defines keyword patterns and lists used by the PromptAnalyzer
 * to detect clarity issues, structural signals, bias risks, and malicious intent.
 */



// --- Question Words & Auxiliary Verbs ---
// 
export const WH_QUESTION_WORDS = ["what", "where", "when", "why", "who", "how", "which", "whom", "whose"];
export const YES_NO_AUXILIARY_VERBS = [ 
    "is", "are", "was", "were", "am", "do", "does", "did", "has", "have", "had", "will", "would",
    "can", "could","shall", "should", "may", "might", "must" 
];

// List of abbreviations where the period is PART of the abbreviation
// and NOT usually a sentence terminator by itself if more text follows.
// This list needs careful curation. We will protect internal dots here.
// For things like "P.M." where it often IS a sentence terminator, we might let wink-nlp handle it
// or have a more complex rule.
export const ABBREVIATIONS_WITH_INTERNAL_DOTS_TO_PROTECT: string[] = [
  'U.S.', 'U.S.A.', 'e.g.', 'i.e.', 'Ph.D.', 'a.m.', 'p.m.', 'P.M.', 'A.M.',
  'No.', 'St.', 'Ave.', 'Inc.', 'Ltd.', 'Jr.', 'Sr.', 'vs.', 'Prof.', 'Dr.',
  'Mr.', 'Mrs.', 'Ms.', 'Co.', 'Corp.', 'D.C.', 'etc.'
];

/**
 * External reference detection patterns used across agents.
 * Detects URLs, common file extensions and phrases like "see attached".
 */
export const EXTERNAL_REFERENCE_PATTERNS: PatternWithMetadata[] = [
  {
    pattern: /https?:\/\//i,
    reason: "HTTP/HTTPS URL detected - indicates external web reference",
    severity: SeverityLevel.LOW,
    metadata: { type: 'vagueness', listSubType: 'external_reference', formatType: 'text' }
  },
  {
    pattern: /\bwww\./i,
    reason: "WWW domain detected - indicates external web reference",
    severity: SeverityLevel.LOW,
    metadata: { type: 'vagueness', listSubType: 'external_reference', formatType: 'text' }
  },
  {
    pattern: /\.(pdf|docx?|xlsx?|pptx?)\b/i,
    reason: "File extension detected - indicates external document reference",
    severity: SeverityLevel.MEDIUM,
    metadata: { type: 'vagueness', listSubType: 'external_reference', formatType: 'text' }
  },
  {
    pattern: /\bsee attached\b/i,
    reason: "Reference to attached content - indicates missing context dependency",
    severity: SeverityLevel.HIGH,
    metadata: { type: 'vagueness', listSubType: 'missing_context', formatType: 'text' }
  },
  {
    pattern: /\bsee the attached\b/i,
    reason: "Reference to attached content - indicates missing context dependency",
    severity: SeverityLevel.HIGH,
    metadata: { type: 'vagueness', listSubType: 'missing_context', formatType: 'text' }
  },
  {
    pattern: /\battached (file|document)\b/i,
    reason: "Reference to attached file/document - indicates missing context dependency",
    severity: SeverityLevel.HIGH,
    metadata: { type: 'vagueness', listSubType: 'missing_context', formatType: 'text' }
  },
];
