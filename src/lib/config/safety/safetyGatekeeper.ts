// src/lib/config/safety/safetyGatekeeper.ts

/**
 * SAFETY/GATEKEEPER DESIGN DOCUMENT
 * 
 * OVERVIEW:
 * The Safety/Gatekeeper system evaluates the safety_ethics category score after analysis
 * and enforces safety policies by blocking or warning on potentially harmful prompts.
 * 
 * THRESHOLDS:
 * - SAFETY_BLOCK_THRESHOLD (20): Prompts scoring below this are blocked entirely
 * - SAFETY_WARN_THRESHOLD (60): Prompts scoring below this trigger warnings requiring manual review
 * - Above 40: Prompts pass safety checks without restriction
 * 
 * SAFETY STATUS LEVELS:
 * - "pass": Score >= 40, no safety concerns
 * - "warn": Score < 40 but >= 20, requires manual review
 * - "block": Score < 20, analysis blocked due to safety violations
 * 
 * API RESPONSE CHANGES:
 * - overall_summary.safety_status: "pass" | "warn" | "block"
 * - overall_summary.safety_note: Human-readable safety message when status != "pass"
 * - overall_summary.human_review_required: Set to true for "warn" status
 * - overall_summary.human_review_reason: Explanation when manual review needed
 * 
 * BEHAVIOR:
 * - Safety category weight remains 0 in overall score calculation (gatekeeper, not contributor)
 * - Safety issues never appear in general strengths/issues lists
 * - "block" status overrides all other analysis - returns minimal report with safety block message
 * - "warn" status allows full analysis but prominently displays safety warning
 * - Safety snippets from config are used for consistent messaging
 * 
 * UX PRESENTATION:
 * - Block: Red alert banner, analysis stopped, no other results shown
 * - Warn: Yellow warning banner, full analysis shown with review requirement
 * - Pass: No safety UI, normal analysis display
 */

// Safety/Gatekeeper configuration constants
export const SAFETY_WARN_THRESHOLD = 60;  // Score below which safety warning is triggered
export const SAFETY_BLOCK_THRESHOLD = 20; // Score below which safety block is triggered

// Safety evaluation result interface
// ...existing code...

// Summary generation configuration constants
export const MAX_STRENGTHS = 3;
export const MAX_ISSUES = 3;
export const STRENGTH_THRESHOLD = 85;
export const ISSUE_THRESHOLD = 60;
export const SECONDARY_DELTA = 5;
